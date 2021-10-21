import { container, InjectionToken } from 'tsyringe';
import { Ref, ref } from 'vue';
import range from 'lodash.range';
import { RecognitionService } from './Base';

export interface PdfRenderer {
  init(pdf: ArrayBuffer): void;
  render(page: number): Promise<ArrayBuffer>;
}

export const pdfRendererToken: InjectionToken<PdfRenderer> = Symbol();

export class PdfRecognitionService extends RecognitionService {
  constructor(private readonly pdf: ArrayBuffer) {
    super();
    this.pdfRenderer.init(pdf);
  }
  private readonly pdfRenderer = container.resolve(pdfRendererToken);
  range: Array<number | [number, number]> = [];
  private get pageNumbers() {
    return this.range.map((el) => (Array.isArray(el) ? range(...el) : el)).flat();
  }

  result: Ref<null | string[]> = ref(null);
  async recognize() {
    const result: string[] = [];

    for (const pageNumber of this.pageNumbers) {
      const pageImage = await this.pdfRenderer.render(pageNumber);
      result.push(await this.recognizor.recognize(this.langs, pageImage));
    }

    this.result.value = result;
  }
}
