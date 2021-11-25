<script lang="ts">
import { defineComponent, provide } from 'vue';
import { ResourceService, token as resourceToken } from 'domain/service/ResourceService';
import { selfish } from '../utils/helper';
import Recognizor from './Recognizor/index.vue';
import MonitorConfig from './MonitorConfig/index.vue';

export default defineComponent({
  components: { Recognizor, MonitorConfig },
  setup() {
    const resourceService = selfish(new ResourceService());
    const { monitorService, recognitionService } = resourceService;

    provide(resourceToken, resourceService);

    return { monitorService, recognitionService };
  },
});
</script>
<template>
  <main>
    <MonitorConfig v-if="monitorService" />
    <Recognizor v-if="recognitionService" />
  </main>
</template>
