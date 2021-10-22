import { InjectionToken, container } from 'tsyringe';
import type { Ref } from 'vue';
import type EventEmitter from 'eventemitter3';
import { appToken } from '../AppService';
import { LANGS_SETTING_KEY } from 'driver/joplin/constants';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Recognizor extends EventEmitter {
  recognize(langs: string[], image: ArrayBuffer, rect?: Rect): Promise<string>;
  destroy(): Promise<void>;
  init(allLangs: string[]): Promise<void>;
}

export const recognizorToken: InjectionToken<Recognizor> = Symbol();
export abstract class RecognitionService {
  constructor() {
    this.init();
  }
  private readonly joplin = container.resolve(appToken);
  protected readonly recognizor = container.resolve(recognizorToken);
  abstract result: Ref<unknown | null>;
  langs: string[] = ['eng'];
  allLangs: string[] = ['eng'];
  abstract recognize(): Promise<void>;
  destroy() {
    return this.recognizor.destroy();
  }

  private async init() {
    this.allLangs = (await this.joplin.getSettingOf<string>(LANGS_SETTING_KEY)).split('+');
    this.recognizor.init(this.allLangs);
  }
}
