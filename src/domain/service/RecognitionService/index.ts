import { ImageRecognitionService } from './Image';
import { VideoRecognitionService } from './Video';

export const isWithRect = (
  service: unknown,
): service is ImageRecognitionService | VideoRecognitionService =>
  service instanceof ImageRecognitionService || service instanceof VideoRecognitionService;

export { ImageRecognitionService } from './Image';
export { VideoRecognitionService, VideoRenderer, videoRendererToken } from './Video';
export { PdfRecognitionService, pdfRendererToken, PdfRenderer } from './Pdf';
export { RecognitionService, Recognizor, Rect, recognizorToken, RecognizorEvents } from './Base';
