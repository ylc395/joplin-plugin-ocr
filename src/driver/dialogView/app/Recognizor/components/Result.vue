<script lang="ts">
import { defineComponent, inject, ref, watch } from 'vue';
import { Progress, Textarea, Button, Select } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import {
  RecognizorEvents,
  ImageRecognitionService,
  VideoRecognitionService,
  PdfRecognitionService,
} from 'domain/service/RecognitionService';

export default defineComponent({
  components: { Progress, Textarea, Button, Select, SelectOption: Select.Option },
  setup() {
    const { recognitionService } = inject(resourceToken)!;
    const progress = ref(0);
    const resultIndex = ref(0);
    const updateResultIndex = (num: string) => (resultIndex.value = Number(num));

    if (!recognitionService.value) {
      throw new Error('no recognitionService');
    }

    recognitionService.value.recognizor.on(RecognizorEvents.Progress, (e: number) => {
      progress.value = e;
    });

    return {
      progress,
      recognitionService,
      resultIndex,
      updateResultIndex,
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
    <div v-if="recognitionService?.errorMessage.value">
      {{ recognitionService.errorMessage.value }}
    </div>
    <template v-if="recognitionService?.result.value">
      <Textarea
        v-if="recognitionService instanceof ImageRecognitionService"
        class="resize-none w-full h-full p-2 outline-none"
        v-model:value="recognitionService.result.value"
      />
      <div
        v-if="
          recognitionService instanceof VideoRecognitionService ||
          recognitionService instanceof PdfRecognitionService
        "
        class="flex flex-col w-full h-full"
      >
        <Textarea
          class="resize-none w-full flex-grow p-2 outline-none mb-2"
          v-model:value="recognitionService.result.value[resultIndex].result"
        />
        <div>
          <Select
            class="w-28"
            v-if="recognitionService.result.value.length > 1"
            :value="resultIndex"
            @change="updateResultIndex"
          >
            <SelectOption
              v-for="({ name }, index) of recognitionService.result.value"
              :key="name"
              :value="index"
            >
              {{ name }}
            </SelectOption>
          </Select>
        </div>
      </div>
    </template>
  </div>
</template>
