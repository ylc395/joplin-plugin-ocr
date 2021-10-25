import { MARKDOWN_SCRIPT_ID } from 'driver/constants';
import { isResourceType } from 'domain/model/Resource';
import type { MarkdownOcrRequest } from '../type';
import { attachToImage, attachToPdf, attachToVideo, BTN_CLASS_NAME } from './attach';

declare const webviewApi: {
  postMessage: (id: string, payload: MarkdownOcrRequest) => Promise<void>;
};

class Attacher {
  private readonly btnContainerEl = document.createElement('div');
  private clearButtons() {
    this.btnContainerEl.innerHTML = '';
  }

  callOcr(payload: MarkdownOcrRequest['payload']) {
    webviewApi.postMessage(MARKDOWN_SCRIPT_ID, { event: 'markdownOcrRequest', payload });
  }

  init() {
    document.body.appendChild(this.btnContainerEl);
    // this event is not documented, but can be found in
    // https://github.com/laurent22/joplin/blob/cbfc646745f2774fbe89e30c8020cfe5e6465545/packages/renderer/MdToHtml/rules/mermaid_render.js#L38
    document.addEventListener('joplin-noteDidUpdate', this.clearButtons.bind(this));
    document.addEventListener('joplin-noteDidUpdate', attachToPdf);

    document.body.addEventListener(
      'load',
      (e) => {
        if ((e.target as HTMLElement).tagName === 'IMG') {
          attachToImage(e.target as HTMLImageElement, this.btnContainerEl);
        }
      },
      true,
    );

    document.body.addEventListener(
      'loadedmetadata',
      (e) => {
        if ((e.target as HTMLElement).tagName === 'VIDEO') {
          attachToVideo(e.target as HTMLVideoElement, this.btnContainerEl);
        }
      },
      true,
    );

    document.addEventListener('click', (e) => {
      let target = e.target as HTMLElement;

      if (target.matches(`.${BTN_CLASS_NAME} *`)) {
        while (!target.classList.contains(BTN_CLASS_NAME)) {
          target = target.parentElement!;
        }
      }

      if (target.classList.contains(BTN_CLASS_NAME)) {
        const { ocrUrl, ocrIndex, ocrType } = target.dataset;

        if (!ocrUrl || !ocrIndex || !isResourceType(ocrType)) {
          throw new Error('invalid ocr button');
        }

        this.callOcr({
          url: ocrUrl,
          index: Number(ocrIndex),
          resourceType: ocrType,
        });
      }
    });
  }
}

const attacher = new Attacher();
attacher.init();
