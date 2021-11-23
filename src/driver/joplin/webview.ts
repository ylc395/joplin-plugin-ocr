import { container } from 'tsyringe';
import { appToken } from 'domain/service/AppService';
import type {
  GetResourcesRequest,
  GetResourcesResponse,
  GetInstallDirRequest,
  GetInstallDirResponse,
  GetSettingOfRequest,
} from './request';

declare const webviewApi: {
  postMessage: <T>(
    payload: GetResourcesRequest | GetInstallDirRequest | GetSettingOfRequest,
  ) => Promise<T>;
};

export const getInstallDir = () => {
  return webviewApi.postMessage<GetInstallDirResponse>({ event: 'getInstallDir' });
};

export const getResources = () => {
  return webviewApi.postMessage<GetResourcesResponse>({ event: 'getResources' });
};

export const getSettingOf = <T>(key: string) => {
  return webviewApi.postMessage<T>({ event: 'getSettingOf', payload: key });
};

container.registerInstance(appToken, { getResources, getSettingOf });
