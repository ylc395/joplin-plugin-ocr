import { container } from 'tsyringe';
import { EventEmitter } from 'eventemitter3';
import { toRaw } from 'vue';
import { appToken } from 'domain/service/AppService';
import {
  recognizorToken,
  RecognizorParams,
  RecognizorEvents,
} from 'domain/service/RecognitionService';
import type { Request, GetResourcesResponse } from './request';

declare const webviewApi: {
  postMessage: <T>(payload: Request) => Promise<T>;
};

export const getResources = () => {
  return webviewApi.postMessage<GetResourcesResponse>({ event: 'getResources' });
};

export const getSettingOf = <T>(key: string) => {
  return webviewApi.postMessage<T>({ event: 'getSettingOf', payload: key });
};

class Recognizor extends EventEmitter<RecognizorEvents> {
  private timer?: ReturnType<typeof setInterval>;
  recognize(image: ArrayBuffer, params: RecognizorParams) {
    this.timer = this.loopQueryProgress();
    return webviewApi.postMessage<string>({
      event: 'recognize',
      payload: { image, params: { ...params, langs: toRaw(params.langs) } },
    });
  }

  stop() {
    this.timer && clearInterval(this.timer);
    return webviewApi.postMessage<void>({ event: 'stopRecognizing' });
  }

  init(allLangs: string[]) {
    return webviewApi.postMessage<string>({
      event: 'intRecognizor',
      payload: { allLangs: toRaw(allLangs) },
    });
  }

  private loopQueryProgress() {
    let progress = 0;
    return setInterval(async () => {
      const currentProgress = await webviewApi.postMessage<number>({ event: 'queryProgress' });
      if (currentProgress > progress) {
        progress = currentProgress;
        this.emit(RecognizorEvents.Progress, progress);

        if (progress === 1 && this.timer) {
          clearInterval(this.timer);
        }
      }
    }, 1000);
  }
}

container.registerInstance(appToken, { getResources, getSettingOf });
container.registerSingleton(recognizorToken, Recognizor);
