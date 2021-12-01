import joplin from 'api';
import { nextAvailable } from 'node-port-check';
import { OPEN, WebSocket, WebSocketServer } from 'ws';
import { ContentScriptType, SettingItemType, ToolbarButtonLocation, ViewHandle } from 'api/types';
import type { ResourceType, Resource } from 'domain/model/Resource';
import { LANGS_SETTING_KEY, MONITOR_SETTING_KEY } from 'domain/service/AppService';
import {
  MARKDOWN_SCRIPT_ID,
  CODE_MIRROR_SCRIPT_ID,
  WINDOW_HEIGHT,
  WINDOW_WIDTH,
} from 'driver/constants';
import { Request, MarkdownOcrRequest } from './request';

export class Joplin {
  private dialog?: ViewHandle;
  private wsPort?: number;
  private resource?: Resource;
  private async handleRequest(request: Request) {
    switch (request.event) {
      case 'getResources':
        return this.resource;
      case 'getWsPort':
        return this.wsPort;
      case 'getInstallDir':
        return joplin.plugins.installationDir();
      case 'getSettingOf':
        return joplin.settings.value(request.payload);
      case 'markdownOcrRequest':
        return this.startOcr(request.payload);
      case 'setSettingOf':
        return joplin.settings.setValue(request.payload.key, request.payload.value);
      case 'queryCurrentNoteId':
        return (await joplin.workspace.selectedNote()).id;
      default:
        break;
    }
  }

  async initWs() {
    type ExtendedWs = WebSocket & { isAlive: boolean };
    const port: number = await nextAvailable(3000);
    this.wsPort = port;

    const wss = new WebSocketServer({ port });
    wss.on('connection', (ws: ExtendedWs) => {
      ws.isAlive = true;
      ws.on('pong', () => (ws.isAlive = true));
      ws.on('message', (message) => {
        wss.clients.forEach((client) => {
          if (client.readyState === OPEN) {
            client.send(message);
          }
        });
      });
    });

    setInterval(() => {
      wss.clients.forEach((ws) => {
        if (!(ws as ExtendedWs).isAlive) {
          ws.terminate();
        } else {
          (ws as ExtendedWs).isAlive = false;
          ws.ping();
        }
      });
    }, 30000);
  }

  private async startOcr(request?: MarkdownOcrRequest['payload']) {
    if (!this.dialog) {
      throw new Error('no dialog');
    }

    this.resource = undefined;

    if (request) {
      const { resourceType, index, url } = request;
      this.resource = await Joplin.getResource(url, resourceType);
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
    await joplin.settings.registerSettings({
      [MONITOR_SETTING_KEY]: {
        label: 'Monitor Config',
        type: SettingItemType.String,
        public: false,
        value: '',
      },
    });
  }

  async setupToolbar() {
    const COMMAND_NAME = 'openOCR';
    await joplin.commands.register({
      name: COMMAND_NAME,
      label: 'Open OCR',
      execute: this.startOcr.bind(this),
      iconName: 'fas fa-closed-captioning',
    });

    await joplin.views.toolbarButtons.create(
      'openOCRButton',
      COMMAND_NAME,
      ToolbarButtonLocation.EditorToolbar,
    );
  }

  async setupCodeMirror() {
    await joplin.contentScripts.register(
      ContentScriptType.CodeMirrorPlugin,
      CODE_MIRROR_SCRIPT_ID,
      './driver/codeMirror/index.js',
    );

    await joplin.contentScripts.onMessage(CODE_MIRROR_SCRIPT_ID, this.handleRequest.bind(this));
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
