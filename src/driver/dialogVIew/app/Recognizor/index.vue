<script lang="ts">
import { defineComponent, inject } from 'vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { isUrlResource } from 'domain/model/Resource';

export default defineComponent({
  setup() {
    const { selectedResource, recognitionService } = inject(resourceToken)!;

    return { isUrlResource, selectedResource, recognitionService };
  },
});
</script>
<template>
  <div v-if="recognitionService">
    <div>{{ recognitionService.result }}</div>
    <div>
      <button @click="recognitionService?.recognize">recognize</button>
    </div>
  </div>
</template>
