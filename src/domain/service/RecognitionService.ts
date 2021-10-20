import { InjectionToken, container } from 'tsyringe';
import type { Ref } from 'vue';
import type EventEmitter from 'eventemitter3';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Recognizor extends EventEmitter {
  recognize(langs: string[], image: ArrayBuffer, rect?: Rect): Promise<string>;
}

export const recognizorToken: InjectionToken<Recognizor> = Symbol();
export abstract class RecognitionService {
  protected readonly recognizor = container.resolve(recognizorToken);
  abstract result: Ref<unknown | null>;
  lang: string[] = [];
  abstract recognize(): Promise<void>;
}
