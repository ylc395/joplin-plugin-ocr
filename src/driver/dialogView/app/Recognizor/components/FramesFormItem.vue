<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import { container } from 'tsyringe';
import { Input, FormItem } from 'ant-design-vue';
import { CameraOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { useRange, useFrameTime } from '../composable';
import { PdfViewer } from '../../../utils/PdfRenderer';

export default defineComponent({
  components: { FormItem, Input, CameraOutlined, PlusOutlined },
  setup() {
    const { selectedResource } = inject(resourceToken)!;
    const { range, validateStatus } = useRange();
    const { getTime } = useFrameTime();
    const capturePage = () => {
      const viewer = container.resolve(PdfViewer);
      const currentPage = viewer.currentPage.value;

      range.value = range.value ? `${range.value},${currentPage}` : currentPage.toString();
    };

    const captureFrame = () => {
      const time = getTime();
      range.value = range.value ? `${range.value},${time}` : time;
    };

    return {
      range,
      validateStatus,
      selectedResource,
      capture: () => {
        if (selectedResource.value?.type === 'video') {
          captureFrame();
        }

        if (selectedResource.value?.type === 'pdf') {
          capturePage();
        }
      },
      label: computed(() => {
        switch (selectedResource.value?.type) {
          case 'pdf':
            return 'Pages';
          case 'video':
            return 'Frames';
          default:
            return '';
        }
      }),
      help: computed(() => {
        switch (selectedResource.value?.type) {
          case 'pdf':
            return 'Type page numbers and/or page ranges separated by commas. For example, type 1,3,5-12';
          case 'video':
            return 'Type time and/or time ranges separated by commas. For example, type 0:34,1:31,2:00-3:00';
          default:
            return '';
        }
      }),
      placeholder: computed(() => {
        switch (selectedResource.value?.type) {
          case 'pdf':
            return 'Left empty to recognize all pages';
          case 'video':
            return 'Left empty to recognize all frames of video';
          default:
            return '';
        }
      }),
    };
  },
});
</script>
<template>
  <FormItem name="frames" :validateStatus="validateStatus" :label="label" :help="help">
    <Input v-model:value="range" :placeholder="placeholder">
      <template #addonAfter>
        <CameraOutlined v-if="selectedResource?.type === 'video'" @click="capture" />
        <PlusOutlined v-if="selectedResource?.type === 'pdf'" @click="capture" />
      </template>
    </Input>
  </FormItem>
</template>
