import { Ref, toRaw, ref, computed } from 'vue';
import { RecognitionService } from './Base';
import type { Rect } from '../../model/Recognition';

export class ImageRecognitionService extends RecognitionService {
  constructor(private readonly image: ArrayBuffer) {
    super();
  }

  readonly isParamsValid = computed(() => {
    return this.params.langs.length > 0;
  });
  readonly result: Ref<string> = ref('');
  readonly rect: Ref<Rect | undefined> = ref(undefined);

  async recognize() {
    this.isRecognizing.value = true;
    try {
      this.result.value = this.postProcess(
        await this.recognizor.recognize(this.image, {
          ...this.params,
          rect: toRaw(this.rect.value),
          jobCount: 1,
        }),
      );
    } catch (error) {
      this.errorMessage.value = String(error);
    }
    this.isRecognizing.value = false;
  }
}
