import { recognize } from 'tesseract.js';
import type { GetResourceRequest, GetResourceResponse } from './type';
const rootEl = document.getElementById('joplin-plugin-content');

if (!rootEl) {
  throw new Error('no root El');
}

declare const webviewApi: {
  postMessage: (payload: GetResourceRequest) => Promise<GetResourceResponse>;
};

webviewApi.postMessage({ event: 'getResource' }).then(({ resource }) => {
  const file = typeof resource === 'string' ? resource : new File([resource], 'myImage');

  recognize(file, 'eng', { logger: console.log }).then(
    ({ data: { text } }) => (rootEl.innerHTML = text),
  );
});
