<script lang="ts">
import { Button, Form } from 'ant-design-vue';
import { defineComponent, inject, computed } from 'vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import Result from './Result.vue';
import { useBlobUrl } from '../composable';
import { selfish } from 'driver/dialogView/utils/helper';

export default defineComponent({
  components: { Button, Form, Result },
  setup() {
    const { recognitionService, selectedResource } = inject(resourceToken)!;

    if (!recognitionService.value) {
      throw new Error('no recognitionService');
    }

    const { result, isParamsValid, recognize, isRecognizing, allLangs } = selfish(
      recognitionService.value,
    );

    return {
      allLangs,
      recognize,
      isParamsValid,
      resourceBlobUrl: useBlobUrl(selectedResource),
      showingResult: computed(() => result.value || isRecognizing.value),
    };
  },
});
</script>
<template>
  <div class="flex">
    <div
      class="h-screen w-60 flex flex-col items-center mr-4 flex-shrink-0 overflow-auto"
      v-if="resourceBlobUrl"
    >
      <slot :resourceBlobUrl="resourceBlobUrl" name="preview" />
    </div>
    <p v-if="allLangs.length === 0" class="mb-4 flex items-center">
      This plugin is not enabled now. Please set available language codes for this plugin in Joplin
      Setting Panel to enable this plugin.
    </p>
    <template v-else>
      <Result v-if="showingResult" class="flex-grow" />
      <div v-else class="flex flex-col justify-between">
        <Form layout="vertical">
          <slot name="formItems" />
        </Form>
        <div class="text-right">
          <Button type="primary" @click="recognize" :disabled="!isParamsValid">Recognize</Button>
        </div>
      </div>
    </template>
  </div>
</template>
