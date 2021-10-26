<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Input, FormItem, Button, Modal } from 'ant-design-vue';
import { ScissorOutlined } from '@ant-design/icons-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { getRootEl } from 'driver/dialogView/utils/helper';
import { useBlobUrl, useCropper } from '../composable';

export default defineComponent({
  components: { Input, FormItem, Button, Modal, ScissorOutlined },
  setup() {
    const { recognitionService, selectedResource } = inject(resourceToken)!;
    const { isClipping, imgRef, startClip, endClip } = useCropper();

    return {
      selectedResource,
      recognitionService,
      resourceBlobUrl: useBlobUrl(selectedResource),
      getContainer: getRootEl,
      isClipping,
      imgRef,
      startClip,
      endClip,
      handleConfirm() {
        recognitionService.value!.rect.value = endClip();
      },
    };
  },
});
</script>
<template>
  <FormItem label="Area" v-if="recognitionService">
    <div class="flex flex-nowrap mb-2">
      <Input
        readOnly
        :value="recognitionService.rect.value?.left"
        type="number"
        class="mr-3"
        addonBefore="X"
      />
      <Input
        :value="recognitionService.rect.value?.width"
        readOnly
        type="number"
        addonBefore="Width"
      />
    </div>
    <div class="flex flex-nowrap mb-2">
      <Input
        :value="recognitionService.rect.value?.top"
        readOnly
        type="number"
        class="mr-3"
        addonBefore="Y"
      />
      <Input
        :value="recognitionService.rect.value?.height"
        readOnly
        type="number"
        addonBefore="Height"
      />
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
      </div>
      <div class="text-right bg-white pt-2">
        <Button class="mr-2" @click="endClip">Cancel</Button>
        <Button type="primary" @click="handleConfirm">Confirm</Button>
      </div>
    </div>
  </Modal>
</template>
