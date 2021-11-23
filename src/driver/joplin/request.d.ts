import type { Resource } from 'domain/model/Resource';
import type { ResourceType } from 'domain/model/Resource';
import type { RecognizorParams } from 'domain/service/RecognitionService';

export type Request =
  | GetResourcesRequest
  | GetSettingOfRequest
  | RecognizeRequest
  | StopRecognizingRequest
  | MarkdownOcrRequest
  | QueryProgressRequest
  | InitRecognizorRequest;

export interface GetResourcesRequest {
  event: 'getResources';
}

export interface GetSettingOfRequest {
  event: 'getSettingOf';
  payload: string;
}

export interface GetResourcesResponse {
  resources: Resource[] | Resource;
}

export interface RecognizeRequest {
  event: 'recognize';
  payload: {
    image: ArrayBuffer | Uint8Array;
    params: RecognizorParams;
  };
}

export interface StopRecognizingRequest {
  event: 'stopRecognizing';
}

export interface QueryProgressRequest {
  event: 'queryProgress';
}

export interface InitRecognizorRequest {
  event: 'intRecognizor';
  payload: {
    allLangs: string[];
  };
}

export interface MarkdownOcrRequest {
  event: 'markdownOcrRequest';
  payload: {
    url: string;
    index: number;
    resourceType: ResourceType;
  };
}
