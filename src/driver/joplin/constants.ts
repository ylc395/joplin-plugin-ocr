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
  resources: Array<{ body: Uint8Array; mime: string; id: string; filename: string } | string>;
}

export type GetInstallDirResponse = string;

export const LANGS_SETTING_KEY = 'langs';
