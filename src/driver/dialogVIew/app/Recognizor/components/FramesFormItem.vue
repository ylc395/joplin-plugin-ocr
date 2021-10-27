<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import { Input, FormItem } from 'ant-design-vue';
import { CameraOutlined } from '@ant-design/icons-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { useRange, useFrameCapture } from '../composable';

export default defineComponent({
  components: { FormItem, Input, CameraOutlined },
  setup() {
    const { selectedResource } = inject(resourceToken)!;
    const { range, validateStatus } = useRange();
    const { capture } = useFrameCapture();

    return {
      range,
      validateStatus,
      capture: () => {
        const time = capture();
        range.value = range.value ? `${range.value},${time}` : time;
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
    };
  },
});
</script>
<template>
  <FormItem name="frames" :validateStatus="validateStatus" :label="label" :help="help">
    <Input v-model:value="range" placeholder="Left empty to recognize all frames of video">
      <template #addonAfter>
        <CameraOutlined @click="capture" />
      </template>
    </Input>
  </FormItem>
</template>
