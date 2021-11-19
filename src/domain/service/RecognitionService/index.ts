import { ImageRecognitionService } from './Image';
import { VideoRecognitionService } from './Video';
import { PdfRecognitionService } from './Pdf';

export const isWithRect = (
  service: unknown,
): service is ImageRecognitionService | VideoRecognitionService =>
  service instanceof ImageRecognitionService || service instanceof VideoRecognitionService;

export const isWithRange = (
  service: unknown,
): service is PdfRecognitionService | VideoRecognitionService =>
  service instanceof PdfRecognitionService || service instanceof VideoRecognitionService;

export { ImageRecognitionService } from './Image';
export { VideoRecognitionService, VideoRenderer, videoRendererToken } from './Video';
export { PdfRecognitionService, pdfRendererToken, PdfRenderer } from './Pdf';
export {
  RecognitionService,
  Recognizor,
  recognizorToken,
  RecognizorEvents,
  RecognizorParams,
} from './Base';
