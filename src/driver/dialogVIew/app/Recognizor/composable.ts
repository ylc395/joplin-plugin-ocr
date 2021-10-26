import Cropper from 'cropperjs';
import mapValues from 'lodash.mapvalues';
import 'cropperjs/dist/cropper.css';
import { computed, Ref, ref, nextTick } from 'vue';
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

export function useCropper() {
  const isClipping = ref(false);
  const imgRef: Ref<HTMLImageElement | null> = ref(null);
  let cropper: Cropper | null = null;

  const startClip = () => {
    isClipping.value = true;
    nextTick(() => {
      if (!imgRef.value || cropper) {
        return;
      }

      cropper = new Cropper(imgRef.value, { guides: false, viewMode: 2, dragMode: 'move' });
    });
  };

  const endClip = () => {
    isClipping.value = false;
    if (!cropper) {
      throw new Error('no error');
    }

    const { x, y, width, height } = cropper.getData();
    return mapValues({ top: y, left: x, width, height }, Math.floor);
  };

  return { isClipping, startClip, imgRef, endClip };
}
