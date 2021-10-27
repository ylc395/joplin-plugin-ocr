import { container, InjectionToken } from 'tsyringe';
import { Ref, ref, computed } from 'vue';
import range from 'lodash.range';
import { RecognitionService, Rect, toRangeArray } from './Base';

export { Rect } from './Base';

export interface VideoRenderer {
  init(video: ArrayBuffer): void;
  render(frame: number, rect?: Rect): Promise<ArrayBuffer>;
}

export const videoRendererToken: InjectionToken<VideoRenderer> = Symbol();

export class VideoRecognitionService extends RecognitionService {
  constructor(video: ArrayBuffer) {
    super();
    this.videoRenderer.init(video);
  }
  readonly isParamsValid = computed(() => {
    return this.langs.value.length > 0 && this.range.isValid.value;
  });
  readonly rect: Ref<Rect | undefined> = ref(undefined);
  private readonly videoRenderer = container.resolve(videoRendererToken);
  range = {
    raw: ref(''),
    parse(): Array<number | [number, number]> {
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
      return toRangeArray(this.raw.value).map((v) =>
        Array.isArray(v) ? (v.map(toSeconds) as [number, number]) : toSeconds(v),
      );
    },
    isValid: computed(() => {
      if (!this.range.raw.value) {
        return true;
      }

      let values: string[];

      try {
        values = toRangeArray(this.range.raw.value).flat();
      } catch {
        return false;
      }

      const timeReg = /^(\d+:)?(\d{1,2}):\d{1,2}$/;
      return values.every((v) => timeReg.test(v));
    }),
  };
  sampleInterval: number = 1000;
  readonly result: Ref<null | string[]> = ref(null);
  private get frames() {
    return this.range
      .parse()
      .map((el) => (Array.isArray(el) ? range(...el, this.sampleInterval) : el))
      .flat();
  }
  async recognize() {
    if (!this.isParamsValid.value) {
      throw new Error('invalid params');
    }

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
