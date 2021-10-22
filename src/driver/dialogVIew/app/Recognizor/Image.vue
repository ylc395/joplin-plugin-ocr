<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Button } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { ImageRecognitionService } from 'domain/service/RecognitionService';
import LangGroup from './components/LangGroup.vue';
import { useBlobUrl } from './composable';

export default defineComponent({
  components: { LangGroup, Button },
  setup() {
    const { recognitionService, selectedResource } = inject(resourceToken)!;

    return {
      recognitionService,
      ImageRecognitionService,
      resourceBlobUrl: useBlobUrl(selectedResource),
    };
  },
});
</script>
<template>
  <div class="flex" v-if="recognitionService instanceof ImageRecognitionService">
    <div v-if="resourceBlobUrl">
      <img style="width: 50px; height: 50px" :src="resourceBlobUrl" />
    </div>
    <div>
      <form>
        <LangGroup />
      </form>
      <div>
        <Button @click="recognitionService?.recognize()">Recognize</Button>
      </div>
    </div>
  </div>
</template>
