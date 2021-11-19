import { container, InjectionToken } from 'tsyringe';
import { Ref, ref, computed } from 'vue';
import { PdfRange, range } from '../../model/Recognition';
import { RecognitionService } from './Base';

export interface PdfRenderer {
  init(pdf: ArrayBuffer, scale: Ref<number>): void;
  render(page: number): Promise<ArrayBuffer>;
  totalPage: Ref<number>;
}

export const pdfRendererToken: InjectionToken<PdfRenderer> = Symbol();

export class PdfRecognitionService extends RecognitionService {
  constructor(pdf: ArrayBuffer) {
    super();
    this.pdfRenderer.init(pdf, this.scale);
  }
  private readonly pdfRenderer = container.resolve(pdfRendererToken);
  readonly range = new PdfRange();
  readonly scale = ref(2);
  readonly totalPage = this.pdfRenderer.totalPage;

  readonly result: Ref<undefined | Array<{ name: string; result: string }>> = ref();
  readonly isParamsValid = computed(() => {
    return this.params.langs.length > 0 && this.range.isValid.value;
  });

  async recognize() {
    if (!this.isParamsValid.value) {
      throw new Error('invalid params');
    }

    const results: Promise<string>[] = [];
    let pageNumbers = this.range.toPages();
    pageNumbers =
      pageNumbers.length > 0 ? pageNumbers : range([1, this.pdfRenderer.totalPage.value]);
    this.isRecognizing.value = true;

    for (const pageNumber of pageNumbers) {
      const pageImage = await this.pdfRenderer.render(pageNumber);
      results.push(
        this.recognizor.recognize(pageImage, { ...this.params, jobCount: pageNumbers.length }),
      );
    }

    try {
      this.result.value = (await Promise.all(results)).map((result, i) => ({
        result,
        name: `Page ${pageNumbers[i]}`,
      }));
    } catch (error) {
      this.errorMessage.value = String(error);
    }
    this.isRecognizing.value = false;
  }
}
