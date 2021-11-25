<script lang="ts">
import { defineComponent, provide } from 'vue';
import { ResourceService, token as resourceToken } from 'domain/service/ResourceService';
import { selfish } from '../utils/helper';
import SideMenu from './SideMenu/index.vue';
import Recognizor from './Recognizor/index.vue';
import CommonConfig from './CommonConfig/index.vue';

export default defineComponent({
  components: { SideMenu, Recognizor, CommonConfig },
  setup() {
    const resourceService = selfish(new ResourceService());
    const { mode, monitorService } = resourceService;

    provide(resourceToken, resourceService);

    return { mode, monitorService };
  },
});
</script>
<template>
  <main class="flex">
    <SideMenu />
    <CommonConfig v-if="mode !== 'single' && monitorService" />
    <Recognizor v-if="mode === 'single'" />
  </main>
</template>
