import Cropper from 'cropperjs';
import mapValues from 'lodash.mapvalues';
import 'cropperjs/dist/cropper.css';
import { computed, Ref, ref, nextTick, inject } from 'vue';
import { Resource, isUrlResource } from 'domain/model/Resource';
import { token as resourceToken } from 'domain/service/ResourceService';
import { isWithRange, isWithRect } from 'domain/service/RecognitionService';

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
export function useFrameTime() {
  const getTime = () => {
    if (!videoRef.value) {
      throw new Error('no video el');
    }

    const { currentTime } = videoRef.value;
    const hour = Math.floor(currentTime / 3600);
    const minute = Math.floor((currentTime % 3600) / 60);
    const second = Math.floor((currentTime % 3600) % 60);

    return `${hour}:${minute}:${second}`;
  };

  return { videoRef, getTime };
}

export function useCropper() {
  const { videoRef } = useFrameTime();
  const isClipping = ref(false);
  const imgRef: Ref<HTMLImageElement | HTMLCanvasElement | null> = ref(null);
  const { recognitionService } = inject(resourceToken)!;
  let cropper: Cropper | null = null;

  const startClip = () => {
    isClipping.value = true;
    nextTick(() => {
      if (!imgRef.value) {
        throw new Error('no imgRef');
      }

      if (!videoRef.value && cropper) {
        return;
      }

      if (videoRef.value) {
        const canvasEl = imgRef.value as HTMLCanvasElement;
        canvasEl.height = videoRef.value.videoHeight;
        canvasEl.width = videoRef.value.videoWidth;

        const context = canvasEl.getContext('2d')!;
        context.drawImage(videoRef.value, 0, 0);
      }

      cropper?.destroy();
      cropper = new Cropper(imgRef.value as HTMLImageElement, {
        guides: false,
        viewMode: 2,
        dragMode: 'move',
      });
    });
  };

  const endClip = (isConfirm = false) => {
    isClipping.value = false;

    if (!cropper) {
      throw new Error('no cropper');
    }

    if (!isWithRect(recognitionService.value)) {
      throw new Error('wrong type recognitionService');
    }

    if (!isConfirm) {
      return;
    }

    const { x, y, width, height } = cropper.getData();

    recognitionService.value.rect.value = mapValues({ top: y, left: x, width, height }, Math.floor);
  };

  return { isClipping, startClip, imgRef, endClip };
}
