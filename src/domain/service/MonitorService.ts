import { container } from 'tsyringe';
import { Ref, ref, computed } from 'vue';
import { MonitorConfig, TextInsertionType } from '../model/Recognition';
import { appToken, MONITOR_SETTING_KEY, LANGS_SETTING_KEY, langsStrToArray } from './AppService';

export class MonitorService {
  constructor() {
    this.init();
  }

  private readonly joplin = container.resolve(appToken);
  readonly allLangs: Ref<string[]> = ref([]);
  private currentNoteId?: string;
  readonly config: Ref<MonitorConfig> = ref({
    isMonitoring: false,
    langs: [],
    whitelist: '',
    wordSpacePreserved: '0',
    textInsertionType: TextInsertionType.Replace,
    newlineIgnored: false,
  } as MonitorConfig);
  readonly isConfigValid = computed(() => {
    return Boolean(!this.config.value?.isMonitoring || this.config.value?.langs.length);
  });

  private async init() {
    this.currentNoteId = await this.joplin.getCurrentNoteId();
    const configs = JSON.parse(
      (await this.joplin.getSettingOf<string>(MONITOR_SETTING_KEY)) || '{}',
    ) as Record<string, MonitorConfig>;

    this.config.value = { ...this.config.value, ...configs[this.currentNoteId] };

    const allLangsStr = await this.joplin.getSettingOf<string>(LANGS_SETTING_KEY);
    this.allLangs.value = langsStrToArray(allLangsStr);
  }

  async setConfig() {
    const config = JSON.parse(
      (await this.joplin.getSettingOf<string>(MONITOR_SETTING_KEY)) || '{}',
    );

    if (!this.currentNoteId || !this.config.value) {
      throw new Error('can not set monitor');
    }

    if (this.config.value.isMonitoring) {
      config[this.currentNoteId] = this.config.value;
    } else {
      delete config[this.currentNoteId];
    }

    this.joplin.setSettingOf(MONITOR_SETTING_KEY, JSON.stringify(config));
  }
}
