export type ResourceType = 'image' | 'video' | 'pdf' | 'unsupported';
export interface File {
  body: Uint8Array;
  mime: string;
  id: string;
  filename: string;
}

export interface UrlResource {
  type: ResourceType;
  url: string;
  body?: ArrayBuffer;
}

export interface FileResource {
  type: ResourceType;
  file: File;
}

export type Resource = UrlResource | FileResource;

export const isUrlResource = (resource: Resource): resource is UrlResource => 'url' in resource;

export const isResourceType = (str: any): str is ResourceType => {
  return ['image', 'pdf', 'video'].includes(str);
};

export const getResourceTypeFromMime = (mime: string): ResourceType => {
  if (mime.includes('image')) {
    return 'image';
  }

  if (mime.includes('video')) {
    return 'video';
  }

  if (mime.includes('pdf')) {
    return 'pdf';
  }

  return 'unsupported';
};

export function secondsToFrameName(seconds: number) {
  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  const second = Math.floor((seconds % 3600) % 60);

  return `${hour}:${minute}:${second}`;
}

export interface ResourceIdentifier {
  resourceId: string;
  index: number;
}
