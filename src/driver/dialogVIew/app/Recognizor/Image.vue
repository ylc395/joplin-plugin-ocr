<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import { Button, Input, FormItem, Form } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { ImageRecognitionService } from 'domain/service/RecognitionService';
import LangFormItem from './components/LangFormItem.vue';
import ClipFormItem from './components/ClipFormItem.vue';
import Result from './components/Result.vue';
import { useBlobUrl } from './composable';
import { getRootEl } from 'driver/dialogView/utils/helper';

export default defineComponent({
  components: { LangFormItem, ClipFormItem, Result, Button, Input, Form, FormItem },
  setup() {
    const { recognitionService, selectedResource } = inject(resourceToken)!;
    const showingResult = computed(
      () => recognitionService.value?.result.value || recognitionService.value?.isRecognizing.value,
    );

    return {
      showingResult,
      recognitionService,
      resourceBlobUrl: useBlobUrl(selectedResource),
      ImageRecognitionService,
    };
  },
});
</script>
<template>
  <div class="flex">
    <div
      class="h-screen w-60 flex items-center mr-4 flex-shrink-0 overflow-auto"
      v-if="resourceBlobUrl"
    >
      <img :src="resourceBlobUrl" />
    </div>
    <Result v-if="showingResult" class="flex-grow" />
    <div v-else class="flex flex-col justify-between">
      <Form layout="vertical">
        <LangFormItem />
        <ClipFormItem />
      </Form>
      <div class="text-right">
        <Button
          type="primary"
          @click="recognitionService?.recognize()"
          :disabled="recognitionService?.langs.value.length === 0"
          >Recognize</Button
        >
      </div>
    </div>
  </div>
</template>
