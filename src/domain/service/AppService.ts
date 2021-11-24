import type { InjectionToken } from 'tsyringe';
import { Resource } from '../model/Resource';
export interface App {
  getResource(): Promise<Resource | undefined>;
  getSettingOf<T>(key: string): Promise<T>;
}

export const appToken: InjectionToken<App> = Symbol();

export const LANGS_SETTING_KEY = 'langs';
