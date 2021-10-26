<script lang="ts">
import { Button, Form } from 'ant-design-vue';
import { defineComponent, inject, computed } from 'vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import Result from './Result.vue';
import { useBlobUrl } from '../composable';

export default defineComponent({
  components: { Button, Form, Result },
  setup() {
    const { recognitionService, selectedResource } = inject(resourceToken)!;
    const showingResult = computed(
      () => recognitionService.value?.result.value || recognitionService.value?.isRecognizing.value,
    );

    return {
      showingResult,
      recognitionService,
      resourceBlobUrl: useBlobUrl(selectedResource),
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
      <slot :resourceBlobUrl="resourceBlobUrl" name="preview" />
    </div>
    <Result v-if="showingResult" class="flex-grow" />
    <div v-else-if="recognitionService" class="flex flex-col justify-between">
      <Form layout="vertical">
        <slot name="formItems" />
      </Form>
      <div class="text-right">
        <Button
          type="primary"
          @click="recognitionService?.recognize()"
          :disabled="recognitionService.langs.value.length === 0"
          >Recognize</Button
        >
      </div>
    </div>
  </div>
</template>
