import Cropper from 'cropperjs';
import mapValues from 'lodash.mapvalues';
import 'cropperjs/dist/cropper.css';
import { computed, Ref, ref, nextTick, inject, provide } from 'vue';
import { Resource, isUrlResource } from 'domain/model/Resource';
import { token as resourceToken } from 'domain/service/ResourceService';
import { isWithRange } from 'domain/service/RecognitionService';

export function useBlobUrl(resource: Ref<Resource | null>) {
  return computed(() => {
    if (!resource.value) {
      throw new Error('no resource');
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

export function useRange() {
  const { recognitionService } = inject(resourceToken)!;

  if (!isWithRange(recognitionService.value)) {
    throw new Error('no service');
  }

  const validateStatus = computed<'success' | 'error'>(() => {
    if (isWithRange(recognitionService.value)) {
      return recognitionService.value.range.isValid.value ? 'success' : 'error';
    }

    return 'error';
  });

  return {
    range: recognitionService.value.range.raw,
    validateStatus,
  };
}

const videoRef: Ref<null | HTMLVideoElement> = ref(null);
export function useFrameCapture() {
  const capture = () => {
    if (!videoRef.value) {
      throw new Error('no video el');
    }

    const { currentTime } = videoRef.value;
    const hour = Math.floor(currentTime / 3600);
    const minute = Math.floor((currentTime % 3600) / 60);
    const second = Math.floor((currentTime % 3600) % 60);

    return `${hour}:${minute}:${second}`;
  };

  return { videoRef, capture };
}
