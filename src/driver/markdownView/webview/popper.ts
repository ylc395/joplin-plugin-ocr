import { createPopper, Rect } from '@popperjs/core';

const BTN_HIDE_CLASS_NAME = 'ocr-button-hidden';

export function attachPopper(containerEl: HTMLElement, targetEl: HTMLElement) {
  const popper = createPopper(containerEl, targetEl, {
    placement: 'right-start',
    modifiers: [
      {
        name: 'offset',
        options: { offset: ({ popper }: { popper: Rect }) => [0, -popper.width] },
      },
      { name: 'flip', enabled: false },
    ],
  });

  const showButton = () => {
    targetEl.classList.remove(BTN_HIDE_CLASS_NAME);
    popper.setOptions((options) => ({
      ...options,
      modifiers: [...(options.modifiers || []), { name: 'eventListeners', enabled: true }],
    }));

    popper.update();
  };

  const hideButton = () => {
    targetEl.classList.add(BTN_HIDE_CLASS_NAME);
    popper.setOptions((options) => ({
      ...options,
      modifiers: [...(options.modifiers || []), { name: 'eventListeners', enabled: false }],
    }));
  };

  targetEl.classList.add(BTN_HIDE_CLASS_NAME);

  ['mouseenter', 'focus'].forEach((eventName) => {
    containerEl.addEventListener(eventName, showButton);
  });

  ['mouseleave', 'blur'].forEach((eventName) => {
    containerEl.addEventListener(eventName, hideButton);
  });
}
