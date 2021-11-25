import type { InjectionToken } from 'tsyringe';
import { Resource } from '../model/Resource';
export interface App {
  getResource(): Promise<Resource | undefined>;
  getSettingOf<T>(key: string): Promise<T>;
  setSettingOf(key: string, value: unknown): Promise<void>;
  getCurrentNoteId(): Promise<string>;
}

export const appToken: InjectionToken<App> = Symbol();

export const LANGS_SETTING_KEY = 'LANGS_SETTING_KEY';

export const MONITOR_SETTING_KEY = 'MONITOR_SETTING_KEY';

export const langsStrToArray = (allLangs: string) => {
  return allLangs ? allLangs.split(',').map((lang) => lang.trim()) : [];
};
