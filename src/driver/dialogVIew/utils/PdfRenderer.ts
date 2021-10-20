import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { container } from 'tsyringe';
import { PdfRenderer, pdfRendererToken } from 'domain/service/PdfRecognitionService';

class HTMLPdfRenderer implements PdfRenderer {
  pdfDoc?: PDFDocumentProxy;
  private readonly canvasEl = document.createElement('canvas');
  async init(pdf: ArrayBuffer) {
    this.pdfDoc = await getDocument(new Uint8Array(pdf)).promise;
  }

  async render(page: number) {
    if (!this.pdfDoc) {
      throw new Error('no pdf doc');
    }

    const pdfPage = await this.pdfDoc.getPage(page);
    const viewport = pdfPage.getViewport();

    this.canvasEl.width = viewport.width;
    this.canvasEl.height = viewport.height;

    const canvasContext = this.canvasEl.getContext('2d')!;

    await pdfPage.render({ canvasContext, viewport }).promise;
    return canvasContext.getImageData(0, 0, this.canvasEl.width, this.canvasEl.height).data.buffer;
  }
}

container.register(pdfRendererToken, HTMLPdfRenderer);
