import type { Resource } from 'domain/model/Resource';
export interface GetResourcesRequest {
  event: 'getResources';
}

export interface GetInstallDirRequest {
  event: 'getInstallDir';
}

export interface GetSettingOfRequest {
  event: 'getSettingOf';
  payload: string;
}

export interface GetResourcesResponse {
  resources: Resource[] | Resource;
}

export type GetInstallDirResponse = string;

export const LANGS_SETTING_KEY = 'langs';
