import { recognize } from 'tesseract.js';
import type {
  GetResourceRequest,
  GetResourceResponse,
  GetInstallDirRequest,
  GetInstallDirResponse,
} from './type';
const rootEl = document.getElementById('joplin-plugin-content');

if (!rootEl) {
  throw new Error('no root El');
}

declare const webviewApi: {
  postMessage: <T>(payload: GetResourceRequest | GetInstallDirRequest) => Promise<T>;
};

webviewApi.postMessage<GetInstallDirResponse>({ event: 'getInstallDir' }).then((dir) => {
  webviewApi.postMessage<GetResourceResponse>({ event: 'getResource' }).then(({ resource }) => {
    const file = typeof resource === 'string' ? resource : new File([resource], 'myImage');

    recognize(file, 'eng', {
      workerBlobURL: false,
      logger: console.log,
      workerPath: `${dir}/assets/lib/tesseract.js/worker.min.js`,
      corePath: `${dir}/assets/lib/tesseract.js-core/tesseract-core.wasm.js`,
    }).then(({ data: { text } }) => (rootEl.innerHTML = text));
  });
});
