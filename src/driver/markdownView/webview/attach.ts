import { createPopper, Rect } from '@popperjs/core';
import { ResourceType } from 'domain/model/Resource';

export const BTN_CLASS_NAME = 'ocr-button';

function createButton(
  { url, type, index }: { url: string; type: ResourceType; index: number },
  btnContainerEl?: HTMLElement,
) {
  const button = document.createElement('button');
  button.dataset.ocrType = type;
  button.dataset.ocrUrl = url;
  button.dataset.ocrIndex = String(index);
  button.classList.add(BTN_CLASS_NAME);

  if (btnContainerEl) {
    btnContainerEl.appendChild(button);
  }

  return button;
}

function attachPopper(containerEl: HTMLElement, targetEl: HTMLElement) {
  createPopper(containerEl, targetEl, {
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

export function attachToImage(imgEl: HTMLImageElement, btnContainerEl: HTMLElement) {
  const url = imgEl.dataset.resourceId || imgEl.src;

  if (!url) {
    return;
  }

  const imgsWithSameResource = imgEl.dataset.resourceId
    ? document.querySelectorAll(`[data-resource-id="${url}"]`)
    : document.querySelectorAll(`[src="${url}"]`);
  const index = [...imgsWithSameResource].indexOf(imgEl);
  const button = createButton({ url, type: 'image', index }, btnContainerEl);

  attachPopper(btnContainerEl, button);
}

export function attachToPdf() {
  const pdfEls = document.querySelectorAll(
    'a[data-resource-id][type="application/pdf"]',
  ) as NodeListOf<HTMLElement>;

  for (const el of pdfEls) {
    const url = el.dataset.resourceId;

    if (!url) {
      continue;
    }

    const samePdfEls = document.querySelectorAll(
      `a[data-resource-id="${url}"][type="application/pdf"]`,
    );
    const index = [...samePdfEls].indexOf(el);
    const button = createButton({ url, type: 'pdf', index });

    // don't know why this can work
    button.addEventListener('click', (e) => {
      el.onclick = null;
    });

    el.appendChild(button);
  }
}

// todo: handle when <video> is disabled in Joplin Setting
export function attachToVideo(videoEl: HTMLVideoElement, btnContainerEl: HTMLElement) {
  const src = (() => {
    if (videoEl.currentSrc.startsWith('file://')) {
      const paths = videoEl.currentSrc.split('/');
      return paths[paths.length - 1].split('.')[0];
    } else {
      return videoEl.currentSrc;
    }
  })();

  // todo: find out the right index
  const button = createButton({ url: src, type: 'video', index: 0 }, btnContainerEl);
  attachPopper(btnContainerEl, button);
}
