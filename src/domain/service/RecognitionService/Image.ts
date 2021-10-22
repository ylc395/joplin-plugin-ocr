import { Ref, ref } from 'vue';
import { RecognitionService, Rect } from './Base';

export class ImageRecognitionService extends RecognitionService {
  constructor(private readonly image: ArrayBuffer) {
    super();
  }
  rect?: Rect;
  result: Ref<null | string> = ref(null);
  async recognize() {
    this.result.value = await this.recognizor.recognize(this.langs.value, this.image, this.rect);
  }
}
