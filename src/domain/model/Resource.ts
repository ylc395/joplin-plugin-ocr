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
