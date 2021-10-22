import { container } from 'tsyringe';
import { createScheduler, createWorker, RecognizeResult, Worker } from 'tesseract.js';
import EventEmitter from 'eventemitter3';
import { recognizorToken, Recognizor, Rect } from 'domain/service/RecognitionService';
import { getInstallDir } from 'driver/joplin/webview';

class TesseractRecognizor extends EventEmitter implements Recognizor {
  private readonly scheduler = createScheduler();
  private workers: Worker[] = [];
  private dir?: string;
  private readonly maxWorkerCount = navigator.hardwareConcurrency;
  private allLangs?: string[];
  private lastLangs?: string[];
  constructor() {
    super();
  }

  private async initNewWorker(langs?: string[]) {
    if (!this.dir || !this.allLangs) {
      throw new Error('not init yet');
    }

    const worker = createWorker({
      workerBlobURL: false,
      logger: console.log,
      workerPath: `${this.dir}/assets/lib/tesseract.js/worker.min.js`,
      corePath: `${this.dir}/assets/lib/tesseract.js-core/tesseract-core.wasm.js`,
    });

    await worker.load();
    await worker.loadLanguage(this.allLangs.join('+'));

    if (langs) {
      await worker.initialize(langs.join('+'));
    }

    this.scheduler.addWorker(worker);
    this.workers.push(worker);
  }

  async init(allLangs: string[]) {
    this.dir = await getInstallDir();
    this.allLangs = allLangs;

    return this.initNewWorker();
  }

  destroy() {
    const workers = this.workers;
    this.workers = [];

    return Promise.all(workers.map((worker) => worker.terminate())).then(() => undefined);
  }

  private isNewLang(langs: string[]) {
    return (
      this.lastLangs?.length !== langs.length ||
      langs.some((lang) => !this.lastLangs?.includes(lang))
    );
  }

  async recognize(langs: string[], image: ArrayBuffer, rect?: Rect) {
    if (this.isNewLang(langs)) {
      await Promise.all(this.workers.map((worker) => worker.initialize(langs.join('+'))));
    }

    this.lastLangs = langs;

    const result = this.scheduler.addJob('recognize', new File([image], 'image'), {
      rectangle: rect
        ? {
            top: rect.y,
            left: rect.x,
            width: rect.width,
            height: rect.height,
          }
        : undefined,
    }) as Promise<RecognizeResult>;
    const workerCount = this.scheduler.getNumWorkers();
    const jobCount = this.scheduler.getQueueLen();

    if (jobCount >= workerCount && workerCount < this.maxWorkerCount) {
      this.initNewWorker(langs);
    }

    const {
      data: { text },
    } = await result;

    return text;
  }
}

container.registerSingleton(recognizorToken, TesseractRecognizor);
