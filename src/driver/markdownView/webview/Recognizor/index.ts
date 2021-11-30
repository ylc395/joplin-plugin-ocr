import EventEmitter from 'eventemitter3';
import type {
  GetInstallDirRequest,
  QueryCurrentNoteId,
  GetSettingOfRequest,
  GetWsPortRequest,
} from 'driver/joplin/request';
import type { ResourceIdentifier } from 'domain/model/Resource';
import { TextInsertionType, MonitorConfig } from 'domain/model/Recognition';
import { MONITOR_SETTING_KEY } from 'domain/service/AppService';
import { MARKDOWN_SCRIPT_ID } from 'driver/constants';
import { OcrImage } from './Image';
import { ViewEvents, ImageEvents } from './constants';

export type WsMessage = ResourceIdentifier & {
  text: string;
  removeNeeded: boolean;
};

declare const webviewApi: {
  postMessage: <T>(
    id: string,
    payload: GetInstallDirRequest | QueryCurrentNoteId | GetSettingOfRequest | GetWsPortRequest,
  ) => Promise<T>;
};

const IMG_SELECTOR = 'img[data-resource-id]';

export class Recognizor {
  private currentNoteId?: string;
  private dir?: Promise<string>;
  private params?: MonitorConfig;
  private images: Record<string, OcrImage> = {};
  private initializing?: Promise<void>;
  private masksContainerEl = document.createElement('div');
  private readonly view = new EventEmitter<ViewEvents>();
  private ws?: WebSocket;
  constructor() {
    this.init();
  }

  private async init() {
    this.initWs();
    document.addEventListener(
      // this event is earlier than image load
      'joplin-noteDidUpdate',
      () => (this.initializing = this.handleNoteUpdated()),
    );

    this.dir = webviewApi.postMessage(MARKDOWN_SCRIPT_ID, { event: 'getInstallDir' });
    document.body.appendChild(this.masksContainerEl);

    // when switch to a new notebook or just start joplin, this event will not fired
    document.body.addEventListener(
      'load',
      async (e) => {
        const target = e.target as HTMLElement;
        if (target.matches(IMG_SELECTOR)) {
          await this.initializing;
          this.buildImage(target as HTMLImageElement);
        }
      },
      true,
    );

    await this.handleNoteUpdated();

    const images = [...document.querySelectorAll(IMG_SELECTOR)] as HTMLImageElement[];
    images.forEach((el) => this.buildImage(el));
  }

  private async initWs() {
    const port = await webviewApi.postMessage<number>(MARKDOWN_SCRIPT_ID, { event: 'getWsPort' });
    this.ws = new WebSocket(`ws://127.0.0.1:${port}`);
  }

  private async handleNoteUpdated() {
    const noteId = await webviewApi.postMessage<string>(MARKDOWN_SCRIPT_ID, {
      event: 'queryCurrentNoteId',
    });

    const monitorConfig = JSON.parse(
      (await webviewApi.postMessage<string>(MARKDOWN_SCRIPT_ID, {
        event: 'getSettingOf',
        payload: MONITOR_SETTING_KEY,
      })) || '{}',
    );

    this.params = await monitorConfig[noteId];

    if (noteId === this.currentNoteId) {
      this.view.emit(ViewEvents.NoteUpdated, this.params);
    } else {
      this.currentNoteId = noteId;
      this.view.emit(ViewEvents.NoteChanged);
    }
  }

  private getImageId(el: HTMLImageElement) {
    const resourceId = el.dataset.resourceId;

    if (!resourceId) {
      throw new Error('no resource id');
    }

    const imgsWithSameResource = document.querySelectorAll(`img[data-resource-id="${resourceId}"]`);
    const index = [...imgsWithSameResource].indexOf(el);

    return `${resourceId}-${index}`;
  }

  private async buildImage(el: HTMLImageElement) {
    const params = this.params;

    if (!params) {
      return;
    }

    const dir = await this.dir;
    const id = this.getImageId(el);
    const [resourceId, index] = id.split('-');

    if (!dir) {
      throw new Error('can not build image');
    }

    if (!this.images[id]) {
      const identifier = { resourceId, index: Number(index) };
      const ocrImage = new OcrImage(identifier, {
        dir,
        masksContainer: this.masksContainerEl,
        view: this.view,
      });

      ocrImage.on(ImageEvents.Destroyed, () => {
        delete this.images[id];
      });

      ocrImage.on(ImageEvents.Completed, (text: string) =>
        this.sendRecognitionResult(identifier, text),
      );

      this.images[id] = ocrImage;
    }

    this.images[id].recognize(params);
  }

  private sendRecognitionResult(identifier: ResourceIdentifier, text: string) {
    if (!this.ws || !this.params) {
      throw new Error('no ws/params');
    }

    const message: WsMessage = {
      ...identifier,
      removeNeeded: this.params.textInsertionType === TextInsertionType.RealReplace,
      text,
    };

    const data = JSON.stringify(message);

    this.ws.send(data);
  }
}
