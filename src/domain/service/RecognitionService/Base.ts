import { InjectionToken, container } from 'tsyringe';
import { Ref, ref } from 'vue';
import type EventEmitter from 'eventemitter3';
import { appToken, LANGS_SETTING_KEY } from '../AppService';
import type { Rect } from '../../model/Recognition';

export enum RecognizorEvents {
  Progress = 'PROGRESS',
  Finished = 'FINISHED',
}

export interface Recognizor extends EventEmitter<RecognizorEvents> {
  recognize(
    langs: string[],
    image: ArrayBuffer,
    options: { rect?: Rect; jobCount: number },
  ): Promise<string>;
  stop(): Promise<void>;
  init(allLangs: string[]): void;
}

export const recognizorToken: InjectionToken<Recognizor> = Symbol();

export abstract class RecognitionService {
  constructor() {
    this.init();
  }
  abstract readonly isParamsValid: Ref<boolean>;
  abstract readonly result: Ref<unknown | null>;
  abstract recognize(): Promise<void>;
  private readonly joplin = container.resolve(appToken);
  readonly recognizor = container.resolve(recognizorToken);
  readonly isRecognizing = ref(false);
  readonly langs: Ref<string[]> = ref([]);
  readonly allLangs: Ref<string[]> = ref([]);

  private async init() {
    if (!RecognitionService.allLangs) {
      const allLangsStr = await this.joplin.getSettingOf<string>(LANGS_SETTING_KEY);
      RecognitionService.allLangs = allLangsStr
        ? allLangsStr.split(',').map((lang) => lang.trim())
        : [];
    }
    this.allLangs.value = RecognitionService.allLangs;
    this.recognizor.init(this.allLangs.value);
  }

  private static allLangs?: string[];
  async stopRecognizing() {
    await this.recognizor.stop();
    this.isRecognizing.value = false;
    this.result.value = null;
  }
}
