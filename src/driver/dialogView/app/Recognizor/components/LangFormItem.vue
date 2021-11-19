<script lang="ts">
import { defineComponent, inject, toRefs } from 'vue';
import { Checkbox, FormItem, Switch, Input } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';

export default defineComponent({
  components: { CheckboxGroup: Checkbox.Group, FormItem, Switch, Input },
  setup() {
    const { recognitionService } = inject(resourceToken)!;

    if (!recognitionService.value) {
      throw new Error('no recognitionService');
    }

    return {
      allLangs: recognitionService.value.allLangs,
      ...toRefs(recognitionService.value.params),
    };
  },
});
</script>
<template>
  <FormItem required label="Choose language(s) for this recognition">
    <CheckboxGroup :options="allLangs" v-model:value="langs" />
  </FormItem>
  <FormItem label="Keeps the space between words">
    <Switch v-model:checked="wordSpacePreserved" checkedValue="0" unCheckedValue="1" />
  </FormItem>
  <FormItem label="Result only contains these characters" help="For example: 0123456789">
    <Input v-model:value="whitelist" />
  </FormItem>
</template>
