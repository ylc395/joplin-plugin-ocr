import { container } from 'tsyringe';
import type { Rect } from 'domain/model/Recognition';
import { videoRendererToken, VideoRenderer } from 'domain/service/RecognitionService';

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
    this.videoEl.src = window.URL.createObjectURL(new Blob([video]));
  }

  getVideoLength() {
    if (!this.videoEl) {
      throw new Error('no video el');
    }

    return this.videoEl.duration;
  }

  private captureFrame(rect?: Rect) {
    if (!this.canvasEl || !this.videoEl) {
      throw new Error('no canvas/video');
    }

    this.canvasEl.width = rect?.width ?? this.videoEl.videoWidth;
    this.canvasEl.height = rect?.height ?? this.videoEl.videoHeight;

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

    return new Promise<ArrayBuffer>((resolve) => {
      this.canvasEl!.toBlob((blob) => {
        if (!blob) {
          throw new Error('no blob');
        }
        blob.arrayBuffer().then(resolve);
      });
    });
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
