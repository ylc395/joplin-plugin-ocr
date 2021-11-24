import joplin from 'api';
import { ContentScriptType, SettingItemType, ViewHandle } from 'api/types';
import type { ResourceType, Resource } from 'domain/model/Resource';
import { LANGS_SETTING_KEY } from 'domain/service/AppService';
import { MARKDOWN_SCRIPT_ID, WINDOW_HEIGHT, WINDOW_WIDTH } from 'driver/constants';
import { Request, MarkdownOcrRequest } from './request';

export class Joplin {
  private dialog?: ViewHandle;
  private resource?: Resource;
  private async handleRequest(request: Request) {
    switch (request.event) {
      case 'getResources':
        return this.resource;
      case 'getInstallDir':
        return joplin.plugins.installationDir();
      case 'getSettingOf':
        return joplin.settings.value(request.payload);
      case 'markdownOcrRequest':
        return this.startOcr(request.payload);
      default:
        break;
    }
  }

  private async startOcr({ resourceType, index, url }: MarkdownOcrRequest['payload']) {
    if (!this.dialog) {
      throw new Error('no dialog');
    }

    this.resource = await Joplin.getResource(url, resourceType);

    await joplin.views.dialogs.setHtml(
      this.dialog,
      `<style>#joplin-plugin-content {width: ${WINDOW_WIDTH}px; height: ${WINDOW_HEIGHT}px}</style>`,
    );
    joplin.views.dialogs.open(this.dialog);
  }

  async setupDialog() {
    this.dialog = await joplin.views.dialogs.create('main');
    await joplin.views.dialogs.setButtons(this.dialog, [{ id: 'cancel', title: 'Quit' }]);
    await joplin.views.panels.onMessage(this.dialog, this.handleRequest.bind(this));
    joplin.views.dialogs.addScript(this.dialog, './driver/dialogView/index.js');
  }

  async setupMarkdownView() {
    await joplin.contentScripts.register(
      ContentScriptType.MarkdownItPlugin,
      MARKDOWN_SCRIPT_ID,
      './driver/markdownView/joplinPlugin.js',
    );
    joplin.contentScripts.onMessage(MARKDOWN_SCRIPT_ID, this.handleRequest.bind(this));
  }

  async setupSetting() {
    const SECTION_NAME = 'ocr';

    await joplin.settings.registerSection(SECTION_NAME, {
      label: 'OCR',
    });

    await joplin.settings.registerSettings({
      [LANGS_SETTING_KEY]: {
        label: 'Language Codes',
        type: SettingItemType.String,
        public: true,
        value: '',
        section: SECTION_NAME,
        description:
          'Set all languages that may be used in your daily life & work. Split them by comma(s). Available language code can be found at https://github.com/naptha/tesseract.js/blob/master/docs/tesseract_lang_list.md',
      },
    });
  }

  private static getResource(url: string, type: ResourceType) {
    return joplin.data.get(['resources', url, 'file']).then(
      ({
        body,
        attachmentFilename: filename,
        contentType: mime,
        id,
      }: {
        body: Uint8Array; // 实际上是 ArrayBuffer
        attachmentFilename: string;
        contentType: string;
        id: string;
      }) => ({ file: { filename, body, mime, id }, type }),
      () => ({ url, type }),
    );
  }
}
