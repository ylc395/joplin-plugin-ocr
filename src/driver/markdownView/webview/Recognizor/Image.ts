import EventEmitter from 'eventemitter3';
import { createPopper, Rect } from '@popperjs/core';
import { createWorker, Worker } from 'tesseract.js';
import CircleBar from 'radial-bar';
import type { ResourceIdentifier } from 'domain/model/Resource';
import type { RecognizorParams } from 'domain/service/RecognitionService';
import { OCR_RESULT_PREFIX } from 'driver/constants';
import { ViewEvents, ImageEvents } from './constants';

const MASK_CONTAINER_CLASS_NAME = 'joplin-ocr-mask-container';
const MASK_CONTAINER_HIDDEN_CLASS_NAME = 'joplin-ocr-mask-container-hidden';

const PROGRESS_STYLE = {
  lineWidth: 4,
  backLineFill: '#f5f5f5',
  lineFill: '#3e8ee2',
  bgFill: '#fff',
  progress: 0,
  isShowInfoText: true,
  infoStyle: '30px monospace',
  infoColor: '#000',
};

const getRound = (imgEl: HTMLImageElement) => ({
  radius: Math.min(Math.min(imgEl.width, imgEl.height) / 5, 60),
  x: imgEl.width / 2,
  y: imgEl.height / 2,
});

export class OcrImage extends EventEmitter<ImageEvents> {
  private mask?: ReturnType<typeof createPopper>;
  private worker?: Worker;
  private circleBar?: any;
  private readonly params: RecognizorParams;
  private readonly dir: string;
  private readonly view: EventEmitter<ViewEvents>;
  private readonly masksContainer: HTMLDivElement;
  result?: string;
  constructor(
    private readonly id: ResourceIdentifier,
    {
      view,
      params,
      dir,
      masksContainer,
    }: {
      view: EventEmitter<ViewEvents>;
      params: RecognizorParams;
      dir: string;
      masksContainer: HTMLDivElement;
    },
  ) {
    super();
    this.params = params;
    this.dir = dir;
    this.masksContainer = masksContainer;
    this.view = view;

    view.on(ViewEvents.NoteUpdated, this.handleNoteUpdated);
    view.on(ViewEvents.NoteChanged, this.destroy);

    const { el } = this;

    if (!el) {
      throw new Error('no el for image');
    }

    const encodedText = el.title.match(new RegExp(`${OCR_RESULT_PREFIX}(.+)$`))?.[1];

    if (typeof encodedText === 'string') {
      this.result = decodeURIComponent(encodedText);
    }

    if (!this.result) {
      this.recognize();
    }
  }

  private get el(): HTMLImageElement | undefined {
    const { resourceId, index } = this.id;

    const el = [...document.querySelectorAll(`img[data-resource-id="${resourceId}"]`)][
      index
    ] as HTMLImageElement;

    return el;
  }

  private async recognize() {
    const { el } = this;

    if (!el) {
      throw new Error('no el when recognizing');
    }

    this.createMask(el);
    const { langs, wordSpacePreserved, whitelist } = this.params;
    const worker = createWorker({
      workerBlobURL: false,
      logger: (log) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(log);
        }

        if (log?.status === 'recognizing text') {
          this.updateProgress(log.progress);
        }
      },
      workerPath: `${this.dir}/assets/lib/tesseract.js/worker.min.js`,
      corePath: `${this.dir}/assets/lib/tesseract.js-core/tesseract-core.wasm.js`,
    });
    this.worker = worker;

    await worker.load();
    await worker.loadLanguage(langs.join('+'));
    await worker.initialize(langs.join('+'));
    await worker.setParameters({
      preserve_interword_spaces: wordSpacePreserved,
      tessedit_char_whitelist: whitelist,
    });

    const {
      data: { text },
    } = await this.worker.recognize(el, {
      rectangle: this.params.rect,
    });

    this.result = text;
    this.emit(ImageEvents.Completed, text);
  }

  private destroy = () => {
    this.worker?.terminate();

    if (this.mask) {
      this.mask.destroy();
      this.mask.state.elements.popper.remove();
      this.mask = undefined;
    }

    this.view.off(ViewEvents.NoteUpdated, this.handleNoteUpdated);
    this.view.off(ViewEvents.NoteChanged, this.destroy);
    this.emit(ImageEvents.Destroyed);
    this.removeAllListeners();
  };

  private handleNoteUpdated = () => {
    const { el } = this;

    // when this image has been removed by user
    if (!el) {
      this.destroy();
      return;
    }

    if (!this.mask) {
      throw new Error('no mask when noteUpdated');
    }

    this.mask.state.elements.reference = el;
    this.mask.update();
  };

  private createMask(imgEl: HTMLImageElement) {
    const maskContainerEl = document.createElement('div');
    const canvasEl = document.createElement('canvas');

    canvasEl.width = imgEl.width;
    canvasEl.height = imgEl.height;

    maskContainerEl.appendChild(canvasEl);
    maskContainerEl.style.height = `${imgEl.height}px`;
    maskContainerEl.style.width = `${imgEl.width}px`;
    maskContainerEl.classList.add(MASK_CONTAINER_CLASS_NAME);

    maskContainerEl.append(canvasEl);
    this.masksContainer.append(maskContainerEl);

    this.circleBar = new CircleBar(canvasEl.getContext('2d'), {
      ...PROGRESS_STYLE,
      ...getRound(imgEl),
    });
    this.circleBar.update();

    this.mask = createPopper(imgEl, maskContainerEl, {
      placement: 'top',
      modifiers: [
        {
          name: 'offset',
          options: { offset: ({ reference }: { reference: Rect }) => [0, -reference.height] },
        },
      ],
    });
  }

  private updateProgress(progress: number) {
    const imgEl = this.el;

    // imgEl will be null when progress is updating while note is switching
    if (!imgEl || !progress) {
      return;
    }

    if (!this.mask) {
      throw new Error('no el when updating progress');
    }

    const maskContainerEl = this.mask.state.elements.popper;
    const canvas = maskContainerEl.querySelector('canvas') as HTMLCanvasElement;

    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    this.circleBar.styles({
      ...PROGRESS_STYLE,
      ...getRound(imgEl),
      backLineFill: PROGRESS_STYLE.lineFill,
      lineFill: PROGRESS_STYLE.backLineFill,
    });
    this.circleBar.set(Math.ceil(progress * 100));
    this.circleBar.update();

    if (progress === 1) {
      maskContainerEl.classList.add(MASK_CONTAINER_HIDDEN_CLASS_NAME);
    }
  }
}
