import joplin from 'api';
import { ContentScriptType, ViewHandle } from 'api/types';
import { MARKDOWN_SCRIPT_ID } from '../constants';
import type { MarkdownOcrRequest } from '../markdownView/type';
import type {
  GetInstallDirRequest,
  GetResourceRequest,
  GetResourceResponse,
} from '../dialogView/type';

export class Joplin {
  private dialog?: ViewHandle;
  private resource?: Promise<ArrayBuffer | string>;
  private async handleRequestFromDialog(payload: GetResourceRequest | GetInstallDirRequest) {
    switch (payload.event) {
      case 'getResource':
        if (!this.resource) {
          throw new Error('no resource');
        }
        return { resource: await this.resource } as GetResourceResponse;
      case 'getInstallDir':
        return joplin.plugins.installationDir();
      default:
        break;
    }
  }

  private handleRequestFromMdView({ event, payload }: MarkdownOcrRequest) {
    switch (event) {
      case 'markdownOcrRequest':
        this.ocrResource(payload.url);
        break;
      default:
        break;
    }
  }

  private ocrResource(url: string) {
    if (!this.dialog) {
      throw new Error('no dialog');
    }

    this.resource = joplin.data.get(['resources', url, 'file']).then(
      ({ body }: { body: ArrayBuffer }) => body,
      () => url,
    );
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
}
