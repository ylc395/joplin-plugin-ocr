import { container, InjectionToken } from 'tsyringe';
import { Ref, ref } from 'vue';
import range from 'lodash.range';
import { RecognitionService, Rect } from './Base';

export { Rect } from './Base';

export interface VideoRenderer {
  init(video: ArrayBuffer): void;
  render(frame: number, rect?: Rect): Promise<ArrayBuffer>;
}

export const videoRendererToken: InjectionToken<VideoRenderer> = Symbol();

export class VideoRecognitionService extends RecognitionService {
  constructor(private readonly video: ArrayBuffer) {
    super();
    this.videoRenderer.init(video);
  }
  private readonly videoRenderer = container.resolve(videoRendererToken);
  range: Array<number | [number, number]> = [];
  sampleInterval: number = 1000;
  result: Ref<null | string[]> = ref(null);
  private get frames() {
    return this.range
      .map((el) => (Array.isArray(el) ? range(...el, this.sampleInterval) : el))
      .flat();
  }
  async recognize() {
    const results: Promise<string>[] = [];
    this.isRecognizing.value = true;

    for (const frame of this.frames) {
      const frameImage = await this.videoRenderer.render(frame, this.rect.value);
      results.push(this.recognizor.recognize(this.langs.value, frameImage));
    }

    this.result.value = await Promise.all(results);
    this.isRecognizing.value = true;
  }
}
