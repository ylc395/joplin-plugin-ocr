import { container, InjectionToken } from 'tsyringe';
import { Ref, ref, computed } from 'vue';
import range from 'lodash.range';
import { PdfRange } from 'domain/model/Recognition';
import { RecognitionService } from './Base';

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
  range = new PdfRange();
  private get pageNumbers() {
    return this.range
      .toArray()
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
