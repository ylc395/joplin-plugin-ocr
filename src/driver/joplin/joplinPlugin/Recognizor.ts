import joplin from 'api';
import { cpus } from 'os';
import { createScheduler, createWorker, RecognizeResult, Worker } from 'tesseract.js';
import type { RecognizorParams } from 'domain/service/RecognitionService';

const MAX_WORKER_COUNT = cpus.length || 4;

export class TesseractRecognizor {
  progress?: number;
  private scheduler = createScheduler();
  private workers: Worker[] = [];
  private dir?: string;
  private totalJobCount?: number;
  private allLangs?: string[];
  private lastLangs?: string[];

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

    this.progress = progressSum / this.totalJobCount;
  }

  private async initNewWorker({ langs, wordSpacePreserved, whitelist }: RecognizorParams) {
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
      workerPath: `${this.dir}/assets/lib/tesseract.worker.min.js`,
      // corePath: `${this.dir}/assets/lib/tesseract.js-core/tesseract-core.wasm.js`,
    });
    await worker.load();
    await worker.loadLanguage(this.allLangs.join('+'));

    if (langs) {
      await worker.initialize(langs.join('+'));
    }

    await worker.setParameters({
      preserve_interword_spaces: wordSpacePreserved,
      tessedit_char_whitelist: whitelist,
    });
    this.scheduler.addWorker(worker);
    this.workers.push(worker);
  }

  async init(allLangs: string[]) {
    this.destroy();
    this.allLangs = allLangs;

    if (!this.dir) {
      this.dir = await joplin.plugins.installationDir();
    }
  }

  private destroy() {
    this.stop();
    this.jobProgresses = {};
  }

  private isNewLang(langs: string[]) {
    return (
      this.lastLangs?.length !== langs.length ||
      langs.some((lang) => !this.lastLangs?.includes(lang))
    );
  }

  async recognize(image: ArrayBuffer, params: RecognizorParams) {
    this.progress = 0;

    if (this.isNewLang(params.langs)) {
      await Promise.all(this.workers.map((worker) => worker.initialize(params.langs.join('+'))));
    }

    this.lastLangs = params.langs;
    this.totalJobCount = params.jobCount;

    const workerCount = this.scheduler.getNumWorkers();
    const jobCount = this.scheduler.getQueueLen();

    if (jobCount >= workerCount && workerCount < MAX_WORKER_COUNT) {
      await this.initNewWorker(params);
    }

    const {
      data: { text },
    } = (await this.scheduler.addJob('recognize', Buffer.from(new Uint8Array(image)), {
      rectangle: params.rect,
    })) as RecognizeResult;

    return text;
  }

  async stop() {
    await this.scheduler.terminate(); // terminate a scheduler wont't reset its state, such as workerCount
    this.scheduler = createScheduler();
    this.workers = [];
  }
}
