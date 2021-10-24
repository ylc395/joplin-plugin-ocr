import { Ref, toRaw, ref } from 'vue';
import { RecognitionService, Rect } from './Base';

export class ImageRecognitionService extends RecognitionService {
  constructor(private readonly image: ArrayBuffer) {
    super();
  }

  result: Ref<string> = ref('');

  async recognize() {
    this.isRecognizing.value = true;
    this.result.value = await this.recognizor.recognize(
      toRaw(this.langs.value),
      this.image,
      toRaw(this.rect.value),
    );
    this.isRecognizing.value = false;
  }
}
