<script lang="ts">
import { defineComponent, provide } from 'vue';
import { ResourceService, token as resourceToken } from 'domain/service/ResourceService';
import { selfish } from '../utils/helper';
import SideMenu from './SideMenu/index.vue';
import Recognizor from './Recognizor/index.vue';

export default defineComponent({
  components: { SideMenu, Recognizor },
  setup() {
    provide(resourceToken, selfish(new ResourceService()));
  },
});
</script>
<template>
  <main>
    <SideMenu />
    <Recognizor />
  </main>
</template>
