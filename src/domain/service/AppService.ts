import type { InjectionToken } from 'tsyringe';
import { Resource } from '../model/Resource';
export interface App {
  getResources(): Promise<{ resources: Resource[] | Resource }>;
  getSettingOf<T>(key: string): Promise<T>;
}

export const appToken: InjectionToken<App> = Symbol();
