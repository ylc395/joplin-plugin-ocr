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
  recognize(langs: string[], image: ArrayBuffer, rect?: Rect): Promise<string>;
  init(allLangs: string[]): void;
}

export const recognizorToken: InjectionToken<Recognizor> = Symbol();

export abstract class RecognitionService {
  constructor() {
    this.init();
  }
  abstract readonly isParamsValid: Ref<boolean>;
  abstract readonly result: Ref<unknown>;
  abstract recognize(): Promise<void>;
  private readonly joplin = container.resolve(appToken);
  readonly recognizor = container.resolve(recognizorToken);
  readonly isRecognizing = ref(false);
  readonly langs: Ref<string[]> = ref([]);
  readonly allLangs: Ref<string[]> = ref([]);

  private async init() {
    this.allLangs.value =
      RecognitionService.allLangs ||
      (await this.joplin.getSettingOf<string>(LANGS_SETTING_KEY)).split(',');
    this.recognizor.init(this.allLangs.value);
  }

  private static allLangs?: string[];
}
