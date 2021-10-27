<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Input, FormItem, Button, Modal } from 'ant-design-vue';
import { ScissorOutlined } from '@ant-design/icons-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { isWithRect } from 'domain/service/RecognitionService';
import { getRootEl } from 'driver/dialogView/utils/helper';
import { useBlobUrl, useCropper } from '../composable';

const tips = {
  video: 'Recognition Area for every frame',
} as Record<string, string | undefined>;

export default defineComponent({
  components: { Input, FormItem, Button, Modal, ScissorOutlined },
  setup() {
    const { recognitionService, selectedResource } = inject(resourceToken)!;
    const { isClipping, imgRef, startClip, endClip } = useCropper();

    if (!isWithRect(recognitionService.value)) {
      throw new Error('no recognitionService');
    }

    const { rect } = recognitionService.value;

    return {
      selectedResource,
      rect,
      resourceBlobUrl: useBlobUrl(selectedResource),
      getContainer: getRootEl,
      isClipping,
      imgRef,
      startClip,
      endClip,
      tip: tips[selectedResource.value?.type || ''],
    };
  },
});
</script>
<template>
  <FormItem label="Recognition Area" :help="tip">
    <div class="flex flex-nowrap mb-2">
      <Input readOnly :value="rect?.left" type="number" class="mr-3" addonBefore="X" />
      <Input :value="rect?.width" readOnly type="number" addonBefore="Width" />
    </div>
    <div class="flex flex-nowrap mb-2">
      <Input :value="rect?.top" readOnly type="number" class="mr-3" addonBefore="Y" />
      <Input :value="rect?.height" readOnly type="number" addonBefore="Height" />
    </div>
    <Button block @click="startClip">
      <template #icon><ScissorOutlined /></template>
      Clip</Button
    >
  </FormItem>
  <Modal
    :visible="isClipping"
    :getContainer="getContainer"
    :mask="false"
    :closable="false"
    :footer="null"
    width="100%"
    wrapClassName="full-modal"
  >
    <div class="flex flex-col h-full">
      <div v-if="selectedResource" class="h-5/6">
        <img
          v-if="selectedResource.type === 'image'"
          ref="imgRef"
          class="block max-w-full"
          :src="resourceBlobUrl"
        />
        <canvas v-if="selectedResource.type === 'video'" ref="imgRef" class="block max-w-full" />
      </div>
      <div class="text-right bg-white pt-2">
        <Button class="mr-2" @click="endClip()">Cancel</Button>
        <Button type="primary" @click="endClip(true)">Confirm</Button>
      </div>
    </div>
  </Modal>
</template>
