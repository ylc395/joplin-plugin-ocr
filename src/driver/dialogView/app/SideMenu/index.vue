<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Radio } from 'ant-design-vue';
import { MonitorOutlined } from '@ant-design/icons-vue';
import { token as resourceToken } from 'domain/service/ResourceService';

export default defineComponent({
  components: { Radio: Radio.Button, RadioGroup: Radio.Group, MonitorOutlined },
  setup() {
    const { mode } = inject(resourceToken)!;

    return { mode };
  },
});
</script>
<template>
  <div v-if="mode !== 'single'" class="w-60 mr-4 flex flex-col">
    <RadioGroup class="flex" v-model:value="mode">
      <Radio class="flex-1 text-center" value="monitor">Monitor</Radio>
      <Radio class="flex-1 text-center" disabled value="multiple">Recognize</Radio>
    </RadioGroup>
    <div
      v-if="mode === 'monitor'"
      class="text-center flex-grow flex flex-col justify-center text-gray-400"
    >
      <MonitorOutlined class="text-4xl mb-5" />
      <p class="my-0">Auto Image Recognition</p>
      <p class="my-0">For Current Note</p>
    </div>
  </div>
</template>
