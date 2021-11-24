import { container } from 'tsyringe';
import type { Resource } from 'domain/model/Resource';
import { appToken } from 'domain/service/AppService';
import type {
  GetResourcesRequest,
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

export const getResource = () => {
  return webviewApi.postMessage<Resource>({ event: 'getResources' });
};

export const getSettingOf = <T>(key: string) => {
  return webviewApi.postMessage<T>({ event: 'getSettingOf', payload: key });
};

container.registerInstance(appToken, { getResource, getSettingOf });
