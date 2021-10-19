import { createPopper, Rect } from '@popperjs/core';
import { MARKDOWN_SCRIPT_ID } from '../constants';
import type { MarkdownOcrRequest } from './type';

declare const webviewApi: {
  postMessage: (id: string, payload: MarkdownOcrRequest) => Promise<void>;
};

const BTN_CLASS_NAME = 'ocr-button';

class ImageManager {
  private readonly btnContainerEl = document.createElement('div');
  private attachButton(imgEl: HTMLImageElement) {
    const url = imgEl.dataset.resourceId || imgEl.src;

    if (!url) {
      return;
    }

    const imgsWithSameResource = imgEl.dataset.resourceId
      ? document.querySelectorAll(`[data-resource-id="${url}"]`)
      : document.querySelectorAll(`[src="${url}"]`);

    const button = document.createElement('button');
    button.dataset.ocrUrl = url;
    button.dataset.ocrIndex = [...imgsWithSameResource].indexOf(imgEl).toString();
    button.classList.add(BTN_CLASS_NAME);

    this.btnContainerEl.appendChild(button);
    createPopper(imgEl, button, {
      placement: 'right-start',
      modifiers: [
        {
          name: 'offset',
          options: { offset: ({ popper }: { popper: Rect }) => [0, -popper.width] },
        },
        { name: 'flip', enabled: false },
      ],
    });
  }

  private clearButtons() {
    this.btnContainerEl.innerHTML = '';
  }

  private callOcr(payload: MarkdownOcrRequest['payload']) {
    webviewApi.postMessage(MARKDOWN_SCRIPT_ID, { event: 'markdownOcrRequest', payload });
  }

  init() {
    document.body.appendChild(this.btnContainerEl);
    // this event is not documented, but can be found in
    // https://github.com/laurent22/joplin/blob/cbfc646745f2774fbe89e30c8020cfe5e6465545/packages/renderer/MdToHtml/rules/mermaid_render.js#L38
    document.addEventListener('joplin-noteDidUpdate', this.clearButtons.bind(this));
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList?.contains(BTN_CLASS_NAME)) {
        const { ocrUrl, ocrIndex } = target.dataset;

        if (!ocrUrl || !ocrIndex) {
          throw new Error('invalid ocr button');
        }

        this.callOcr({ url: ocrUrl, index: Number(ocrIndex) });
      }
    });
    document.body.addEventListener(
      'load',
      (e) => {
        if ((e.target as HTMLElement).tagName === 'IMG') {
          this.attachButton(e.target as HTMLImageElement);
        }
      },
      true,
    );
  }
}

const imageManager = new ImageManager();
imageManager.init();
