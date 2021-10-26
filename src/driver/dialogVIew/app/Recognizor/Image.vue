<script lang="ts">
import { defineComponent } from 'vue';
import LangFormItem from './components/LangFormItem.vue';
import ClipFormItem from './components/ClipFormItem.vue';
import Layout from './components/Layout.vue';

export default defineComponent({
  components: { LangFormItem, ClipFormItem, Layout },
});
</script>
<template>
  <Layout>
    <template #preview="{ resourceBlobUrl }">
      <img :src="resourceBlobUrl" />
    </template>
    <template #formItems>
      <LangFormItem />
      <ClipFormItem />
    </template>
  </Layout>
</template>
