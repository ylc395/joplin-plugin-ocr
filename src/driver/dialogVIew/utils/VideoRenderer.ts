import { container } from 'tsyringe';
import type { Rect } from 'domain/model/Recognition';
import { videoRendererToken, VideoRenderer } from 'domain/service/RecognitionService';

class HTMLVideoRenderer implements VideoRenderer {
  private readonly videoEl = document.createElement('video');
  private readonly canvasEl = document.createElement('canvas');
  private isRendering = false;
  private metadataLoadedPromise?: Promise<void>;

  init(video: ArrayBuffer) {
    this.videoEl.src = window.URL.createObjectURL(new Blob([video]));
    this.metadataLoadedPromise = new Promise<void>((resolve) => {
      this.videoEl.addEventListener('loadedmetadata', function handler() {
        resolve();
        this.removeEventListener('loadedmetadata', handler);
      });
    });
  }

  async getVideoLength() {
    if (!this.metadataLoadedPromise) {
      throw new Error('not init');
    }

    await this.metadataLoadedPromise;
    return this.videoEl.duration;
  }

  private captureFrame(rect?: Rect) {
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

    return new Promise<ArrayBuffer>((resolve, reject) => {
      this.canvasEl!.toBlob((blob) => {
        if (!blob) {
          reject(new Error('no blob'));
          return;
        }
        blob.arrayBuffer().then(resolve);
      });
    });
  }

  async render(frame: number, rect?: Rect) {
    if (this.isRendering) {
      throw new Error('can not render during rendering');
    }

    if (!this.metadataLoadedPromise) {
      throw new Error('not init');
    }

    await this.metadataLoadedPromise;
    this.isRendering = true;
    const result = new Promise<ArrayBuffer>((resolve) => {
      const seekedHandler = async () => {
        resolve(await this.captureFrame(rect));
        this.videoEl.removeEventListener('seeked', seekedHandler);
        this.isRendering = false;
      };
      this.videoEl.addEventListener('seeked', seekedHandler);
    });

    this.videoEl.currentTime = frame;
    return result;
  }
}

container.register(videoRendererToken, HTMLVideoRenderer);
