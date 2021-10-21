import joplin from 'api';
import { ContentScriptType, SettingItemType, ViewHandle } from 'api/types';
import { getResourceTypeFromMime, ResourceType } from 'domain/model/Resource';
import { MARKDOWN_SCRIPT_ID } from '../constants';
import type { MarkdownOcrRequest } from '../markdownView/type';
import {
  GetInstallDirRequest,
  GetResourcesRequest,
  GetResourcesResponse,
  LANGS_SETTING_KEY,
} from './constants';

export class Joplin {
  private dialog?: ViewHandle;
  private ocrRequest?: Promise<GetResourcesResponse>;
  private async handleRequestFromDialog(payload: GetResourcesRequest | GetInstallDirRequest) {
    switch (payload.event) {
      case 'getResources':
        return this.ocrRequest;
      case 'getInstallDir':
        return joplin.plugins.installationDir();
      default:
        break;
    }
  }

  private handleRequestFromMdView({ event, payload }: MarkdownOcrRequest) {
    switch (event) {
      case 'markdownOcrRequest':
        this.startOcr(payload, 'url');
        break;
      default:
        break;
    }
  }

  private startOcr(
    { resourceType, index, url }: MarkdownOcrRequest['payload'],
    urlType: 'url' | 'noteId',
  ) {
    if (!this.dialog) {
      throw new Error('no dialog');
    }

    if (urlType === 'url') {
      this.ocrRequest = Joplin.getResource(url, resourceType).then((resource) => ({
        resources: [resource],
      }));
    }

    if (urlType === 'noteId') {
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

    joplin.views.dialogs.open(this.dialog);
  }

  async setupDialog() {
    this.dialog = await joplin.views.dialogs.create('main');
    await joplin.views.dialogs.setButtons(this.dialog, [{ id: 'cancel', title: 'Quit' }]);
    await joplin.views.panels.onMessage(this.dialog, this.handleRequestFromDialog.bind(this));
    joplin.views.dialogs.addScript(this.dialog, './driver/dialogView/index.js');
  }

  async setupMarkdownView() {
    await joplin.contentScripts.register(
      ContentScriptType.MarkdownItPlugin,
      MARKDOWN_SCRIPT_ID,
      './driver/markdownView/index.js',
    );
    joplin.contentScripts.onMessage(MARKDOWN_SCRIPT_ID, this.handleRequestFromMdView.bind(this));
  }

  async setupSetting() {
    const SECTION_NAME = 'ocr';

    await joplin.settings.registerSection(SECTION_NAME, {
      label: 'Pages Publisher',
    });

    await joplin.settings.registerSettings({
      [LANGS_SETTING_KEY]: {
        label: 'Language Codes',
        type: SettingItemType.Array,
        public: true,
        value: [],
        section: SECTION_NAME,
        description:
          'Language Code can be found at https://github.com/naptha/tesseract.js/blob/master/docs/tesseract_lang_list.md',
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
      () => {
        if (!type) {
          throw new Error('no type');
        }
        return { url, type };
      },
    );
  }
}
