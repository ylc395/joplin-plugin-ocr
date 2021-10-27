import { container } from 'tsyringe';
import { downloaderToken } from 'domain/service/ResourceService';

container.registerInstance(downloaderToken, {
  async download(url) {
    const response = await fetch(url);
    const body = await response.arrayBuffer();

    return { body, mime: response.headers.get('Content-Type') || '' };
  },
});
