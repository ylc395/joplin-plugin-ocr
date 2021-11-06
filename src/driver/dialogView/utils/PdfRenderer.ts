import 'pdfjs-dist/build/pdf.worker.entry';
import { getDocument } from 'pdfjs-dist';
import { ref, watchEffect, Ref, shallowRef, computed } from 'vue';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { container, InjectionToken, singleton } from 'tsyringe';
import { PdfRenderer, pdfRendererToken } from 'domain/service/RecognitionService';

// This class is for service layer, but also for view layer
// because we are able to build only one pdfDoc instance by reusing existing instance of this class
const token = pdfRendererToken as InjectionToken<HTMLPdfRenderer>;

export class HTMLPdfRenderer implements PdfRenderer {
  pdfDoc: Ref<PDFDocumentProxy | undefined> = shallowRef();
  private readonly canvasEl = document.createElement('canvas');
  scale?: Ref<number>;
  readonly totalPage = computed(() => this.pdfDoc.value?.numPages || 0);
  async init(pdf: ArrayBuffer, scale: Ref<number>) {
    this.scale = scale;
    this.pdfDoc.value = await getDocument(new Uint8Array(pdf)).promise;
  }

  async render(page: number) {
    if (!this.pdfDoc.value || !this.scale) {
      throw new Error('no pdf doc');
    }

    const pdfPage = await this.pdfDoc.value.getPage(page);
    // rotation 360 is a workaround for pdfjs' bug
    // @see https://github.com/mozilla/pdf.js/issues/10400#issuecomment-707918672
    const viewport = pdfPage.getViewport({ scale: this.scale.value, rotation: 360 });

    this.canvasEl.width = viewport.width;
    this.canvasEl.height = viewport.height;

    const canvasContext = this.canvasEl.getContext('2d')!;

    await pdfPage.render({ canvasContext, viewport }).promise;

    return new Promise<ArrayBuffer>((resolve, reject) => {
      this.canvasEl!.toBlob((blob) => {
        if (!blob) {
          reject(new Error('no blob'));
          return;
        }
        // window.open(window.URL.createObjectURL(blob));
        blob.arrayBuffer().then(resolve);
      });
    });
  }
}

@singleton()
export class PdfViewer {
  private readonly renderer = container.resolve(token);
  private readonly canvasEl: Ref<HTMLCanvasElement | undefined> = ref();
  readonly currentPage = ref(1);

  attachToCanvas(el: HTMLCanvasElement) {
    this.canvasEl.value = el;
    watchEffect(this.render.bind(this));
  }

  private async render() {
    if (!this.renderer.pdfDoc.value) {
      return;
    }

    if (!this.canvasEl.value || !this.renderer.scale?.value) {
      throw new Error('can not renderer');
    }

    const canvasContext = this.canvasEl.value.getContext('2d')!;
    const pdfPage = await this.renderer.pdfDoc.value.getPage(this.currentPage.value);
    // rotation 360 is a workaround for pdfjs' bug
    // @see https://github.com/mozilla/pdf.js/issues/10400#issuecomment-707918672
    const viewport = pdfPage.getViewport({ rotation: 360, scale: this.renderer.scale.value });

    await pdfPage.render({ canvasContext, viewport }).promise;
  }
}

container.registerSingleton(pdfRendererToken, HTMLPdfRenderer);
