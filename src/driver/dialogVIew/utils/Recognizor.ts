import { container } from 'tsyringe';
import { createScheduler, createWorker, RecognizeResult, Worker } from 'tesseract.js';
import EventEmitter from 'eventemitter3';
import {
  recognizorToken,
  Recognizor,
  Rect,
  RecognizorEvents,
} from 'domain/service/RecognitionService';
import { getInstallDir } from 'driver/joplin/webview';

class TesseractRecognizor extends EventEmitter<RecognizorEvents> implements Recognizor {
  private readonly scheduler = createScheduler();
  private workers: Worker[] = [];
  private dir?: string;
  private initPromise?: Promise<void>;
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
      logger: (log) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(log);
        }

        if (log?.status === 'recognizing text') {
          this.emit(RecognizorEvents.Progress, log.progress);
        }
      },
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
    this.initPromise = new Promise(async (resolve) => {
      if (!this.dir) {
        this.dir = await getInstallDir();
      }

      this.allLangs = allLangs;

      await this.initNewWorker();
      resolve();
    });
  }

  destroy() {
    const workers = this.workers;
    this.workers = [];
    this.removeAllListeners();

    return Promise.all(workers.map((worker) => worker.terminate())).then(() => undefined);
  }

  private isNewLang(langs: string[]) {
    return (
      this.lastLangs?.length !== langs.length ||
      langs.some((lang) => !this.lastLangs?.includes(lang))
    );
  }

  async recognize(langs: string[], image: ArrayBuffer, rect?: Rect) {
    await this.initPromise;

    if (this.isNewLang(langs)) {
      await Promise.all(this.workers.map((worker) => worker.initialize(langs.join('+'))));
    }

    this.lastLangs = langs;

    const result = this.scheduler.addJob('recognize', new File([image], 'image'), {
      rectangle: rect || undefined,
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
