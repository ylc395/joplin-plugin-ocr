<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Checkbox } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';

export default defineComponent({
  components: { CheckboxGroup: Checkbox.Group },
  setup() {
    const { recognitionService } = inject(resourceToken)!;

    return { recognitionService };
  },
});
</script>
<template>
  <CheckboxGroup
    v-if="recognitionService"
    :options="recognitionService.allLangs.value"
    v-model:value="recognitionService.langs.value"
  />
</template>
