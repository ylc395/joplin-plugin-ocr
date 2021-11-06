<script lang="ts">
import { defineComponent, inject, ref } from 'vue';
import { Progress, Textarea, Button } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import {
  RecognizorEvents,
  ImageRecognitionService,
  VideoRecognitionService,
  PdfRecognitionService,
} from 'domain/service/RecognitionService';

export default defineComponent({
  components: { Progress, Textarea, Button },
  setup() {
    const { recognitionService } = inject(resourceToken)!;
    const progress = ref(0);

    if (!recognitionService.value) {
      throw new Error('no recognitionService');
    }

    recognitionService.value.recognizor.on(RecognizorEvents.Progress, (e: number) => {
      progress.value = e;
    });

    return {
      progress,
      recognitionService,
      ImageRecognitionService,
      VideoRecognitionService,
      PdfRecognitionService,
    };
  },
});
</script>
<template>
  <div class="flex justify-center items-center">
    <div v-if="recognitionService?.isRecognizing.value" class="flex flex-col justify-center">
      <Progress type="circle" :percent="Math.floor(progress * 100)" />
      <Button @click="recognitionService?.stopRecognizing()" class="mt-4">Cancel</Button>
    </div>
    <Textarea
      v-else-if="recognitionService instanceof ImageRecognitionService"
      class="resize-none w-full h-full p-2 outline-none"
      v-model:value="recognitionService.result.value"
    />
    <Textarea
      v-else-if="
        recognitionService instanceof VideoRecognitionService ||
        recognitionService instanceof PdfRecognitionService
      "
      class="resize-none w-full h-full p-2 outline-none"
      :value="recognitionService.result.value?.join('')"
    />
  </div>
</template>
