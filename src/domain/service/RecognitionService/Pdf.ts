import { container, InjectionToken } from 'tsyringe';
import { Ref, ref, computed } from 'vue';
import range from 'lodash.range';
import { RecognitionService, toRangeArray } from './Base';

export interface PdfRenderer {
  init(pdf: ArrayBuffer): void;
  render(page: number): Promise<ArrayBuffer>;
}

export const pdfRendererToken: InjectionToken<PdfRenderer> = Symbol();

export class PdfRecognitionService extends RecognitionService {
  constructor(pdf: ArrayBuffer) {
    super();
    this.pdfRenderer.init(pdf);
  }
  private readonly pdfRenderer = container.resolve(pdfRendererToken);
  range = {
    raw: ref(''),
    parse(): Array<number | [number, number]> {
      return toRangeArray(this.raw.value).map((v) =>
        Array.isArray(v) ? (v.map(Number) as [number, number]) : Number(v),
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
  private get pageNumbers() {
    return this.range
      .parse()
      .map((el) => (Array.isArray(el) ? range(...el) : el))
      .flat();
  }

  readonly result: Ref<null | string[]> = ref(null);
  readonly isParamsValid = computed(() => {
    return this.langs.value.length > 0 && this.range.isValid.value;
  });

  async recognize() {
    if (!this.isParamsValid.value) {
      throw new Error('invalid params');
    }

    const results: Promise<string>[] = [];

    for (const pageNumber of this.pageNumbers) {
      const pageImage = await this.pdfRenderer.render(pageNumber);
      results.push(this.recognizor.recognize(this.langs.value, pageImage));
    }

    this.result.value = await Promise.all(results);
  }
}
