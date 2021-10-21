import { container, InjectionToken } from 'tsyringe';
import { Ref, ref, shallowRef, InjectionKey } from 'vue';
import { Resource, isUrlResource, getResourceTypeFromMime, UrlResource } from '../model/Resource';
import { RecognitionService } from './RecognitionService';
import { ImageRecognitionService } from './ImageRecognitionService';
import { PdfRecognitionService } from './PdfRecognitionService';
import { VideoRecognitionService } from './VideoRecognitionService';

interface Joplin {
  getResources(): Promise<{ resources: Resource[] }>;
}

interface Downloader {
  download(url: string): Promise<{ body: ArrayBuffer; mime: string }>;
}

export const joplinToken: InjectionToken<Joplin> = Symbol();
export const downloaderToken: InjectionToken<Downloader> = Symbol();

export const token: InjectionKey<ResourceService> = Symbol();

export class ResourceService {
  constructor() {
    this.init();
  }
  recognitionService: Ref<RecognitionService | null> = shallowRef(null);
  private readonly joplin = container.resolve(joplinToken);
  private readonly downloader = container.resolve(downloaderToken);
  readonly resources: Ref<Resource[]> = ref([]);
  readonly selectedResource: Ref<Resource | null> = ref(null);
  private async init() {
    const { resources } = await this.joplin.getResources();

    this.resources.value = resources;
    this.selectResource(0);
  }
  async selectResource(index: number) {
    const resource = this.resources.value[index];
    this.selectedResource.value = resource;

    if (isUrlResource(resource) && !resource.body) {
      await this.downloadUrlResource(resource);
    }

    const body = isUrlResource(resource) ? resource.body! : resource.file.body;
    const constructors = {
      image: ImageRecognitionService,
      video: VideoRecognitionService,
      pdf: PdfRecognitionService,
    } as const;

    if (resource.type !== 'unsupported') {
      this.recognitionService.value = new constructors[resource.type](body);
    }
  }

  private async downloadUrlResource(resource: UrlResource) {
    const { body, mime } = await this.downloader.download(resource.url);
    resource.body = body;
    resource.type = getResourceTypeFromMime(mime);
  }
}
