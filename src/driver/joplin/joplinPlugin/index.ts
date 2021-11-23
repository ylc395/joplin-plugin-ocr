import joplin from 'api';
import { ContentScriptType, SettingItemType, ViewHandle } from 'api/types';
import { getResourceTypeFromMime, ResourceType } from 'domain/model/Resource';
import { LANGS_SETTING_KEY } from 'domain/service/AppService';
import { MARKDOWN_SCRIPT_ID, WINDOW_HEIGHT, WINDOW_WIDTH } from 'driver/constants';
import type { Request, MarkdownOcrRequest, GetResourcesResponse } from '../request';
import { TesseractRecognizor } from './Recognizor';

export class Joplin {
  private readonly recognizor = new TesseractRecognizor();
  private dialog?: ViewHandle;
  private ocrRequest?: Promise<GetResourcesResponse>;
  private async handleRequest(request: Request) {
    switch (request.event) {
      case 'getResources':
        return this.ocrRequest;
      case 'getSettingOf':
        return joplin.settings.value(request.payload);
      case 'markdownOcrRequest':
        return this.startOcr(request.payload, 'resource');
      case 'intRecognizor':
        return this.recognizor.init(request.payload.allLangs);
      case 'recognize':
        return this.recognizor.recognize(
          request.payload.image instanceof Uint8Array
            ? request.payload.image.buffer
            : request.payload.image,
          request.payload.params,
        );
      case 'stopRecognizing':
        return this.recognizor.stop();
      case 'queryProgress':
        return this.recognizor.progress;
      default:
        break;
    }
  }

  private async startOcr(
    { resourceType, index, url }: MarkdownOcrRequest['payload'],
    urlType: 'resource' | 'note',
  ) {
    if (!this.dialog) {
      throw new Error('no dialog');
    }

    if (urlType === 'resource') {
      this.ocrRequest = Joplin.getResource(url, resourceType).then((resource) => ({
        resources: resource,
      }));
    }

    if (urlType === 'note') {
      //todo: handle html elements with url
      this.ocrRequest = new Promise(async (resolve) => {
        let allItems: Array<{ id: string; mime: string }> = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const { items, has_more } = await joplin.data.get(['notes', url, 'resources'], {
            fields: 'id,mime',
            page: page++,
          });

          allItems = allItems.concat(items);
          hasMore = has_more;
        }

        const resources = await Promise.all(
          allItems.map(({ id, mime }) => Joplin.getResource(id, getResourceTypeFromMime(mime))),
        );

        resolve({ resources });
      });
    }

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
