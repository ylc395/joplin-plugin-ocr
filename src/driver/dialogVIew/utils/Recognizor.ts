import { container } from 'tsyringe';
import { createScheduler, createWorker, RecognizeResult, Worker } from 'tesseract.js';
import EventEmitter from 'eventemitter3';
import { recognizorToken, Recognizor, Rect } from 'domain/service/RecognitionService';
import { getInstallDir, getSettingOf } from 'driver/joplin/webview';
import { LANGS_SETTING_KEY } from 'driver/joplin/constants';

class TesseractRecognizor extends EventEmitter implements Recognizor {
  private readonly scheduler = createScheduler();
  private readonly workers: Worker[] = [];
  private lastLangs?: string[];
  private readyPromise: Promise<void> = Promise.reject();
  constructor() {
    super();
    this.init();
  }

  private async initLangs(langs: string[]) {
    if (
      langs.length === this.lastLangs?.length &&
      langs.every((lang) => this.lastLangs?.includes(lang))
    ) {
      return;
    }

    this.lastLangs = langs;
    for (const worker of this.workers) {
      await worker.initialize(langs.join('+'));
    }
  }

  private async init() {
    this.readyPromise = new Promise(async (resolve, reject) => {
      try {
        const dir = await getInstallDir();
        const langs = (await getSettingOf<string>(LANGS_SETTING_KEY)).split(',');

        for (let i = 0; i < navigator.hardwareConcurrency; i++) {
          const worker = createWorker({
            workerBlobURL: false,
            logger: console.log,
            workerPath: `${dir}/assets/lib/tesseract.js/worker.min.js`,
            corePath: `${dir}/assets/lib/tesseract.js-core/tesseract-core.wasm.js`,
          });
          await worker.load();
          await worker.loadLanguage(langs.join('+'));
          this.scheduler.addWorker(worker);
          this.workers.push(worker);
        }
      } catch (error) {
        reject(error);
      }
      resolve();
    });
  }

  async recognize(langs: string[], image: ArrayBuffer, rect?: Rect) {
    await this.readyPromise;
    await this.initLangs(langs);

    const {
      data: { text },
    } = (await this.scheduler.addJob('recognize', new File([image], 'image'), {
      rectangle: rect
        ? {
            top: rect.y,
            left: rect.x,
            width: rect.width,
            height: rect.height,
          }
        : undefined,
    })) as RecognizeResult;

    return text;
  }
}

container.registerSingleton(recognizorToken, TesseractRecognizor);
