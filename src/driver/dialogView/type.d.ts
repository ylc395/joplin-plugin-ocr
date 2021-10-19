export interface GetResourceRequest {
  event: 'getResource';
}

export interface GetResourceResponse {
  resource: Uint8Array | ArrayBuffer | string;
}
