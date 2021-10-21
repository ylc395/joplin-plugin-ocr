import { container, InjectionToken } from 'tsyringe';
import { Ref, ref } from 'vue';
import range from 'lodash.range';
import { RecognitionService, Rect } from './RecognitionService';

export { Rect } from './RecognitionService';

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
  rect?: Rect;
  range: Array<number | [number, number]> = [];
  sampleInterval: number = 1000;
  result: Ref<null | string[]> = ref(null);
  private get frames() {
    return this.range
      .map((el) => (Array.isArray(el) ? range(...el, this.sampleInterval) : el))
      .flat();
  }
  async recognize() {
    const result: string[] = [];

    for (const frame of this.frames) {
      const frameImage = await this.videoRenderer.render(frame, this.rect);
      result.push(await this.recognizor.recognize(this.langs, frameImage));
    }

    this.result.value = result;
  }
}
