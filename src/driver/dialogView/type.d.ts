export interface GetResourceRequest {
  event: 'getResource';
}

export interface GetInstallDirRequest {
  event: 'getInstallDir';
}

export interface GetResourceResponse {
  resource: Uint8Array | ArrayBuffer | string;
}

export type GetInstallDirResponse = string;
