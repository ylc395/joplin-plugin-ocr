<script lang="ts">
import { defineComponent } from 'vue';
import LangFormItem from './components/LangFormItem.vue';
import FramesFormItem from './components/FramesFormItem.vue';
import ClipFormItem from './components/ClipFormItem.vue';
import Layout from './components/Layout.vue';
import { useFrameCapture } from './composable';

export default defineComponent({
  components: { LangFormItem, ClipFormItem, FramesFormItem, Layout },
  setup() {
    const { videoRef } = useFrameCapture();

    return { videoRef };
  },
});
</script>
<template>
  <Layout>
    <template #preview="{ resourceBlobUrl }">
      <video ref="videoRef" controls muted autoplay :src="resourceBlobUrl" />
    </template>
    <template #formItems>
      <LangFormItem />
      <FramesFormItem />
      <ClipFormItem />
    </template>
  </Layout>
</template>
