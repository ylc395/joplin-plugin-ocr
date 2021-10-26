<script lang="ts">
import { defineComponent, inject, watch, ref } from 'vue';
import { Progress, Textarea } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import {
  RecognizorEvents,
  ImageRecognitionService,
  VideoRecognitionService,
} from 'domain/service/RecognitionService';

export default defineComponent({
  components: { Progress, Textarea },
  setup() {
    const { recognitionService } = inject(resourceToken)!;
    const progress = ref(0);
    const onProgress = (e: number) => {
      progress.value = e;
    };

    watch(
      recognitionService,
      (recognitionService) => {
        if (!recognitionService) {
          return;
        }

        recognitionService.recognizor.on(RecognizorEvents.Progress, onProgress);
      },
      { immediate: true },
    );

    return { progress, recognitionService, ImageRecognitionService, VideoRecognitionService };
  },
});
</script>
<template>
  <div class="flex justify-center items-center">
    <Progress v-if="progress < 1" type="circle" :percent="Math.floor(progress * 100)" />
    <Textarea
      v-else-if="recognitionService instanceof ImageRecognitionService"
      class="resize-none w-full h-full p-2 outline-none"
      v-model:value="recognitionService.result.value"
    />
    <Textarea
      v-else-if="recognitionService instanceof VideoRecognitionService"
      class="resize-none w-full h-full p-2 outline-none"
      :value="recognitionService.result.value?.join('')"
    />
  </div>
</template>
