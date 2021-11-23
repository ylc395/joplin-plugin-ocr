import type { ResourceType, Resource } from 'domain/model/Resource';

export type Request =
  | MarkdownOcrRequest
  | GetInstallDirRequest
  | GetResourcesRequest
  | GetSettingOfRequest;

export interface MarkdownOcrRequest {
  event: 'markdownOcrRequest';
  payload: {
    url: string;
    index: number;
    resourceType: ResourceType;
  };
}

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
