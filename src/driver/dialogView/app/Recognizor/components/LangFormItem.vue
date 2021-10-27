<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Checkbox, FormItem } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';

export default defineComponent({
  components: { CheckboxGroup: Checkbox.Group, FormItem },
  setup() {
    const { recognitionService } = inject(resourceToken)!;

    if (!recognitionService.value) {
      throw new Error('no recognitionService');
    }

    return { allLangs: recognitionService.value.allLangs, langs: recognitionService.value.langs };
  },
});
</script>
<template>
  <FormItem label="Languages">
    <CheckboxGroup :options="allLangs" v-model:value="langs" />
  </FormItem>
</template>
