<script lang="ts">
import { defineComponent } from 'vue';
import CommonFormItem from './components/CommonFormItem.vue';
import ClipFormItem from './components/ClipFormItem.vue';
import Layout from './components/Layout.vue';

export default defineComponent({
  components: { CommonFormItem, ClipFormItem, Layout },
});
</script>
<template>
  <Layout>
    <template #preview="{ resourceBlobUrl }">
      <img :src="resourceBlobUrl" />
    </template>
    <template #formItems>
      <CommonFormItem />
      <ClipFormItem />
    </template>
  </Layout>
</template>
