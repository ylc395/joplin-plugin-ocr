<script lang="ts">
import { defineComponent, inject } from 'vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { isUrlResource } from 'domain/model/Resource';
import ImageRecognizor from './Image.vue';
import PdfRecognizor from './Pdf.vue';
import VideoRecognizor from './Video.vue';

export default defineComponent({
  components: { ImageRecognizor, PdfRecognizor, VideoRecognizor },
  setup() {
    const { selectedResource, recognitionService, loadingStatus } = inject(resourceToken)!;

    return { isUrlResource, selectedResource, recognitionService, loadingStatus };
  },
});
</script>
<template>
  <template v-if="selectedResource && recognitionService">
    <ImageRecognizor v-if="selectedResource.type === 'image'" />
    <PdfRecognizor v-if="selectedResource.type === 'pdf'" />
    <VideoRecognizor v-if="selectedResource.type === 'video'" />
  </template>
  <div v-else>{{ loadingStatus }}</div>
</template>
