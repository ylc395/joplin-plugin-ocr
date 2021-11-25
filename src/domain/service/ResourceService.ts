import { container, InjectionToken } from 'tsyringe';
import { Ref, ref, shallowRef, InjectionKey } from 'vue';
import { Resource, isUrlResource, getResourceTypeFromMime, UrlResource } from '../model/Resource';
import {
  RecognitionService,
  ImageRecognitionService,
  PdfRecognitionService,
  VideoRecognitionService,
} from './RecognitionService';
import { appToken } from './AppService';
import { MonitorService } from './MonitorService';

interface Downloader {
  download(url: string): Promise<{ body: ArrayBuffer; mime: string }>;
}

export const downloaderToken: InjectionToken<Downloader> = Symbol();

export const token: InjectionKey<ResourceService> = Symbol();

export class ResourceService {
  constructor() {
    this.init();
  }
  readonly recognitionService: Ref<RecognitionService | undefined> = shallowRef();
  readonly monitorService: Ref<MonitorService | undefined> = shallowRef();
  private readonly joplin = container.resolve(appToken);
  private readonly downloader = container.resolve(downloaderToken);
  readonly resources: Ref<Resource[]> = ref([]);
  readonly mode: Ref<'single' | 'multiple' | 'monitor' | undefined> = ref();
  readonly selectedResource: Ref<Resource | null> = ref(null);
  readonly loadingStatus = ref('');
  private async init() {
    this.loadingStatus.value = 'loading resource...';
    const resource = await this.joplin.getResource();

    if (resource) {
      this.initSingle(resource);
    } else {
      this.monitorService.value = new MonitorService();
      this.mode.value = 'monitor';
    }
  }

  private initSingle(resource: Resource) {
    this.resources.value = [resource];
    this.mode.value = 'single';
    this.selectResource(0);
  }

  async selectResource(index: number) {
    const resource = this.resources.value[index];

    if (resource === this.selectedResource.value) {
      return;
    }

    this.selectedResource.value = resource;
    this.recognitionService.value = undefined;

    if (isUrlResource(resource) && !resource.body) {
      try {
        await this.downloadUrlResource(resource);
      } catch (error) {
        this.loadingStatus.value = `fail to load resource: ${String(error)}`;
        return;
      }
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

    this.loadingStatus.value = '';
  }

  private async downloadUrlResource(resource: UrlResource) {
    const { body, mime } = await this.downloader.download(resource.url);
    resource.body = body;
    resource.type = getResourceTypeFromMime(mime);
  }
}
