import { container, InjectionToken } from 'tsyringe';
import { Ref, ref, computed } from 'vue';
import { range, Rect, VideoRange } from '../../model/Recognition';
import { RecognitionService } from './Base';
import { secondsToFrameName } from 'domain/model/Resource';

export interface VideoRenderer {
  init(video: ArrayBuffer): void;
  render(frame: number, rect?: Rect): Promise<ArrayBuffer>;
  getVideoLength(): Promise<number>;
}

export const videoRendererToken: InjectionToken<VideoRenderer> = Symbol();

export class VideoRecognitionService extends RecognitionService {
  constructor(video: ArrayBuffer) {
    super();
    this.videoRenderer.init(video);
  }
  readonly isParamsValid = computed(() => {
    return this.params.langs.length > 0 && this.range.isValid.value;
  });
  readonly rect: Ref<Rect | undefined> = ref(undefined);
  private readonly videoRenderer = container.resolve(videoRendererToken);
  range = new VideoRange();
  sampleInterval: number = 1;
  readonly result: Ref<undefined | Array<{ name: string; result: string }>> = ref();
  async recognize() {
    if (!this.isParamsValid.value) {
      throw new Error('invalid params');
    }

    const results: Promise<string>[] = [];
    let frames = await this.range.toFrames();
    frames = frames.length > 0 ? frames : range([0, await this.videoRenderer.getVideoLength()]);

    this.isRecognizing.value = true;

    for (const frame of frames) {
      const frameImage = await this.videoRenderer.render(frame, this.rect.value);
      results.push(
        this.recognizor.recognize(frameImage, { ...this.params, jobCount: frames.length }),
      );
    }

    try {
      this.result.value = (await Promise.all(results)).map((result, i) => ({
        result: this.postProcess(result),
        name: secondsToFrameName(frames[i]),
      }));
    } catch (error) {
      this.errorMessage.value = String(error);
    }
    this.isRecognizing.value = false;
  }
}
