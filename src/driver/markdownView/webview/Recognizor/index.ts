import EventEmitter from 'eventemitter3';
import type {
  GetInstallDirRequest,
  QueryCurrentNoteId,
  GetSettingOfRequest,
} from 'driver/joplin/request';
import type { RecognizorParams } from 'domain/service/RecognitionService';
import { MONITOR_SETTING_KEY } from 'domain/service/AppService';
import { MARKDOWN_SCRIPT_ID } from 'driver/constants';
import { OcrImage } from './Image';
import { ViewEvents, ImageEvents } from './constants';

declare const webviewApi: {
  postMessage: <T>(
    id: string,
    payload: GetInstallDirRequest | QueryCurrentNoteId | GetSettingOfRequest,
  ) => Promise<T>;
};

const IMG_SELECTOR = 'img[data-resource-id]';

export class Recognizor {
  private currentNoteId?: string;
  private dir?: Promise<string>;
  private params?: RecognizorParams;
  private images: Record<string, OcrImage> = {};
  private initializing?: Promise<void>;
  private masksContainerEl = document.createElement('div');
  private readonly view = new EventEmitter<ViewEvents>();
  constructor() {
    this.init();
  }

  private init() {
    document.addEventListener(
      'joplin-noteDidUpdate',
      () => (this.initializing = this.handleNoteUpdated()),
    );

    this.dir = webviewApi.postMessage(MARKDOWN_SCRIPT_ID, { event: 'getInstallDir' });
    document.body.appendChild(this.masksContainerEl);
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

    this.initializing = this.handleNoteUpdated();
  }

  private async handleNoteUpdated() {
    const noteId = await webviewApi.postMessage<string>(MARKDOWN_SCRIPT_ID, {
      event: 'queryCurrentNoteId',
    });

    if (noteId === this.currentNoteId) {
      this.view.emit(ViewEvents.NoteUpdated);
      return;
    }

    this.currentNoteId = noteId;
    this.view.emit(ViewEvents.NoteChanged);

    const monitorConfig = JSON.parse(
      (await webviewApi.postMessage<string>(MARKDOWN_SCRIPT_ID, {
        event: 'getSettingOf',
        payload: MONITOR_SETTING_KEY,
      })) || '{}',
    );

    this.params = await monitorConfig[noteId];
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
      this.images[id] = new OcrImage(
        { resourceId, index: Number(index) },
        { params, dir, masksContainer: this.masksContainerEl, view: this.view },
      );

      this.images[id].on(ImageEvents.Destroyed, () => {
        delete this.images[id];
      });
    }
  }
}
