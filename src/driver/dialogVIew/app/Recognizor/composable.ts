import { computed, Ref } from 'vue';
import { Resource, isUrlResource } from 'domain/model/Resource';

export function useBlobUrl(resource: Ref<Resource | null>) {
  return computed(() => {
    if (!resource.value) {
      return '';
    }

    return isUrlResource(resource.value)
      ? resource.value.body
        ? window.URL.createObjectURL(new Blob([resource.value.body]))
        : ''
      : window.URL.createObjectURL(new Blob([resource.value.file.body]));
  });
}
