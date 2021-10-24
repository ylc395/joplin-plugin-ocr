import { container } from 'tsyringe';
import { videoRendererToken, VideoRenderer, Rect } from 'domain/service/RecognitionService';

class HTMLVideoRenderer implements VideoRenderer {
  private videoEl?: HTMLVideoElement;
  private canvasEl?: HTMLCanvasElement;
  private isLoaded = false;
  private isRendering = false;
  init(video: ArrayBuffer) {
    if (this.videoEl || this.canvasEl) {
      throw new Error('can not init video render again!');
    }

    this.canvasEl = document.createElement('canvas');
    this.videoEl = document.createElement('video');
    this.videoEl!.addEventListener('loadeddata', () => (this.isLoaded = true));
    this.videoEl.srcObject = new Blob([video]);
  }

  private captureFrame(rect?: Rect) {
    if (!this.canvasEl || !this.videoEl) {
      throw new Error('no canvas/video');
    }

    this.canvasEl.width = rect?.width ?? this.videoEl.width;
    this.canvasEl.height = rect?.height ?? this.videoEl.height;

    const context = this.canvasEl.getContext('2d')!;

    if (rect) {
      context.drawImage(
        this.videoEl,
        rect.left,
        rect.top,
        rect.width,
        rect.height,
        0,
        0,
        this.canvasEl.width,
        this.canvasEl.height,
      );
    } else {
      context.drawImage(this.videoEl, 0, 0);
    }

    const imageData = context.getImageData(0, 0, this.canvasEl.width, this.canvasEl.height);
    return imageData.data.buffer;
  }

  async render(frame: number, rect?: Rect) {
    if (!this.isLoaded) {
      throw new Error('not loaded yet');
    }

    if (this.isRendering) {
      throw new Error('can not render during rendering');
    }

    this.isRendering = true;
    const result = new Promise<ArrayBuffer>((resolve) => {
      const seekedHandler = async () => {
        resolve(await this.captureFrame(rect));
        this.videoEl!.removeEventListener('seeked', seekedHandler);
        this.isRendering = false;
      };
      this.videoEl!.addEventListener('seeked', seekedHandler);
    });

    this.videoEl!.currentTime = frame;
    return result;
  }
}

container.register(videoRendererToken, HTMLVideoRenderer);
