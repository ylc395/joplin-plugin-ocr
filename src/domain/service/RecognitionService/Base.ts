import { InjectionToken, container } from 'tsyringe';
import { Ref, ref, computed } from 'vue';
import type EventEmitter from 'eventemitter3';
import { appToken, LANGS_SETTING_KEY } from '../AppService';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export enum RecognizorEvents {
  Progress = 'PROGRESS',
  Finished = 'FINISHED',
}

export interface Recognizor extends EventEmitter<RecognizorEvents> {
  recognize(langs: string[], image: ArrayBuffer, rect?: Rect): Promise<string>;
  destroy(): Promise<void>;
  init(allLangs: string[]): Promise<void>;
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
  destroy() {
    return this.recognizor.destroy();
  }

  private async init() {
    this.allLangs.value =
      RecognitionService.allLangs ||
      (await this.joplin.getSettingOf<string>(LANGS_SETTING_KEY)).split(',');
    this.recognizor.init(this.allLangs.value);
  }

  private static allLangs?: string[];
}

export const toRangeArray = (value: string) =>
  value.split(',').map((v) => {
    const range = v.split('-');

    if (range.length > 2) {
      throw new Error('invalid range');
    }

    return (range.length === 1 ? v : range) as string | [string, string];
  });
