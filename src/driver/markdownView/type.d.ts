import type { ResourceType } from 'domain/model/Resource';

export interface MarkdownOcrRequest {
  event: 'markdownOcrRequest';
  payload: {
    url: string;
    index: number;
    resourceType: ResourceType;
  };
}
