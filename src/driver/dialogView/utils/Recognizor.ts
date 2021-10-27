import { container } from 'tsyringe';
import { createScheduler, createWorker, RecognizeResult, Worker } from 'tesseract.js';
import EventEmitter from 'eventemitter3';
import { recognizorToken, Recognizor, RecognizorEvents } from 'domain/service/RecognitionService';
import type { Rect } from 'domain/model/Recognition';
import { getInstallDir } from 'driver/joplin/webview';

const MAX_WORKER_COUNT = navigator.hardwareConcurrency || 4;

class TesseractRecognizor extends EventEmitter<RecognizorEvents> implements Recognizor {
  private scheduler = createScheduler();
  private workers: Worker[] = [];
  private dir?: string;
  private totalJobCount?: number;
  private allLangs?: string[];
  private lastLangs?: string[];
  constructor() {
    super();
  }

  private jobProgresses: Record<string, number> = {};
  private handleProgress(jobId: string, progress: number) {
    if (!this.totalJobCount) {
      throw new Error('no job count');
    }

    this.jobProgresses[jobId] = progress;
    const progressSum = Object.values(this.jobProgresses).reduce(
      (total, progress) => total + progress,
      0,
    );

    this.emit(RecognizorEvents.Progress, progressSum / this.totalJobCount);
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
          this.handleProgress(log.jobId, log.progress);
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
    this.destroy();
    this.allLangs = allLangs;

    if (!this.dir) {
      this.dir = await getInstallDir();
    }
  }

  private destroy() {
    this.stop();
    this.jobProgresses = {};
    this.removeAllListeners();
  }

  private isNewLang(langs: string[]) {
    return (
      this.lastLangs?.length !== langs.length ||
      langs.some((lang) => !this.lastLangs?.includes(lang))
    );
  }

  async recognize(
    langs: string[],
    image: ArrayBuffer,
    options: { rect?: Rect; jobCount?: number } = {},
  ) {
    if (this.isNewLang(langs)) {
      await Promise.all(this.workers.map((worker) => worker.initialize(langs.join('+'))));
    }

    this.lastLangs = langs;
    this.totalJobCount = options.jobCount || 1;

    const workerCount = this.scheduler.getNumWorkers();
    const jobCount = this.scheduler.getQueueLen();

    if (jobCount >= workerCount && workerCount < MAX_WORKER_COUNT) {
      await this.initNewWorker(langs);
    }

    const {
      data: { text },
    } = (await this.scheduler.addJob('recognize', new File([image], 'image'), {
      rectangle: options.rect,
    })) as RecognizeResult;

    return text;
  }

  async stop() {
    await this.scheduler.terminate(); // terminate a scheduler wont't reset its state, such as workerCount
    this.scheduler = createScheduler();
    this.workers = [];
  }
}

container.registerSingleton(recognizorToken, TesseractRecognizor);
