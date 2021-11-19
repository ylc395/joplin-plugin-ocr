<script lang="ts">
import { defineComponent, onMounted, Ref, ref, inject } from 'vue';
import { Button, FormItem } from 'ant-design-vue';
import {
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons-vue';
import { container } from 'tsyringe';
import { token as resourceToken } from 'domain/service/ResourceService';
import { PdfRecognitionService } from 'domain/service/RecognitionService';
import Layout from './components/Layout.vue';
import CommonFormItem from './components/CommonFormItem.vue';
import FramesFormItem from './components/FramesFormItem.vue';
import { PdfViewer } from '../../utils/PdfRenderer';

export default defineComponent({
  components: {
    Button,
    FormItem,
    LeftOutlined,
    RightOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    CommonFormItem,
    FramesFormItem,
    Layout,
  },
  setup() {
    const { recognitionService } = inject(resourceToken)!;

    if (!(recognitionService.value instanceof PdfRecognitionService)) {
      throw new Error('not pdf recognitionService');
    }

    const { totalPage, scale } = recognitionService.value;
    const viewer = container.resolve(PdfViewer);
    const canvasRef: Ref<HTMLCanvasElement | undefined> = ref();
    const nextPage = () => (viewer.currentPage.value += 1);
    const prevPage = () => (viewer.currentPage.value -= 1);
    const zoomIn = () => (scale.value += 0.5);
    const zoomOut = () => (scale.value -= 0.5);

    onMounted(() => {
      viewer.attachToCanvas(canvasRef.value!);
    });

    return { canvasRef, totalPage, viewer, nextPage, prevPage, scale, zoomIn, zoomOut };
  },
});
</script>
<template>
  <Layout>
    <template #preview>
      <div class="w-full overflow-scroll">
        <canvas ref="canvasRef" />
      </div>
      <div v-if="viewer" class="flex justify-center items-center">
        <Button
          v-if="totalPage > 1"
          class="transform scale-75"
          @click="prevPage"
          :disabled="viewer.currentPage.value === 1"
          ><template #icon><LeftOutlined /></template
        ></Button>
        <span class="mx-2">{{ viewer.currentPage.value }} / {{ totalPage }}</span>
        <Button
          v-if="totalPage > 1"
          class="transform scale-75"
          @click="nextPage"
          :disabled="viewer.currentPage.value === totalPage"
          ><template #icon><RightOutlined /></template>
        </Button>
      </div>
    </template>
    <template #formItems>
      <CommonFormItem />
      <FramesFormItem />
      <FormItem
        class="mt-4 mb-2"
        label="Scale"
        help="Scale PDF to make text clear (large) enough, otherwise recognition will be inaccuracy"
      >
        <span class="w-12 inline-block"> {{ scale }} </span>
        <Button class="transform scale-75" @click="zoomOut" :disabled="scale === 1"
          ><template #icon><ZoomOutOutlined /></template
        ></Button>
        <Button class="transform scale-75" @click="zoomIn"
          ><template #icon><ZoomInOutlined /></template
        ></Button>
      </FormItem>
    </template>
  </Layout>
</template>
