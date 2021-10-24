<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Checkbox, FormItem } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';

export default defineComponent({
  components: { CheckboxGroup: Checkbox.Group, FormItem },
  setup() {
    const { recognitionService } = inject(resourceToken)!;

    return { recognitionService };
  },
});
</script>
<template>
  <FormItem label="Languages" v-if="recognitionService">
    <CheckboxGroup
      :options="recognitionService.allLangs.value"
      v-model:value="recognitionService.langs.value"
    />
  </FormItem>
</template>
