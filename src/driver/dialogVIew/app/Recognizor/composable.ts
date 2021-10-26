import Cropper from 'cropperjs';
import mapValues from 'lodash.mapvalues';
import 'cropperjs/dist/cropper.css';
import { computed, Ref, ref, nextTick, inject } from 'vue';
import { Resource, isUrlResource } from 'domain/model/Resource';
import { token as resourceToken } from 'domain/service/ResourceService';
import { PdfRecognitionService, VideoRecognitionService } from 'domain/service/RecognitionService';

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

export function useRange() {
  const { recognitionService } = inject(resourceToken)!;
  const rangeText = ref('');
  const toRangeArray = (value: string) =>
    value.split(',').map((v) => {
      const range = v.split('-');

      if (range.length > 2) {
        throw new Error('invalid range');
      }

      return (range.length === 1 ? v : range) as string | [string, string];
    });
  const validateValue = (value: string) => {
    let values: string[];

    try {
      values = toRangeArray(value).flat();
    } catch {
      return false;
    }

    if (recognitionService.value instanceof VideoRecognitionService) {
      const timeReg = /^(\d+:)?(\d{1,2}):\d{1,2}$/;
      return values.every((v) => timeReg.test(v));
    }

    if (recognitionService.value instanceof PdfRecognitionService) {
      const pageReg = /^\d+$/;
      return values.every((v) => pageReg.test(v));
    }

    return false;
  };

  const range = computed(() => rangeText.value);
  const validateStatus = ref<'success' | 'error'>('success');

  const updateRange = (value: string) => {
    rangeText.value = value;

    if (!validateValue(value)) {
      validateStatus.value = 'error';
      return;
    }

    validateStatus.value = 'success';

    if (recognitionService.value instanceof VideoRecognitionService) {
      const toSeconds = (v: string) => {
        const nums = v.split(':').map(Number);

        if (nums.length === 2) {
          const [minute, second] = nums;
          return minute * 60 + second;
        }

        if (nums.length === 3) {
          const [hour, minute, second] = nums;
          return hour * 3600 + minute * 60 + second;
        }

        throw new Error('invalid time');
      };
      recognitionService.value.range = toRangeArray(value).map((v) =>
        Array.isArray(v) ? (v.map(toSeconds) as [number, number]) : toSeconds(v),
      );
    }

    if (recognitionService.value instanceof PdfRecognitionService) {
      recognitionService.value.range = toRangeArray(value).map((v) =>
        Array.isArray(v) ? (v.map(Number) as [number, number]) : Number(v),
      );
    }
  };

  return {
    range,
    updateRange,
    validateStatus,
  };
}
