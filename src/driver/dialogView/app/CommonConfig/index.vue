<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Checkbox, FormItem, Switch, Input, Button, Form, Radio, message } from 'ant-design-vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { selfish } from 'driver/dialogView/utils/helper';

export default defineComponent({
  components: {
    CheckboxGroup: Checkbox.Group,
    FormItem,
    Switch,
    Input,
    Button,
    Form,
    RadioGroup: Radio.Group,
    Radio,
  },
  setup() {
    const { monitorService, mode } = inject(resourceToken)!;

    if (!monitorService.value) {
      throw Error('no monitor');
    }

    const {
      setConfig: _setConfig,
      config,
      isConfigValid,
      allLangs,
    } = selfish(monitorService.value);

    const setConfig = async () => {
      await _setConfig();

      if (config.value.isMonitoring) {
        message.success('Images will be auto-recognized');
      } else {
        message.info('Images will not be auto-recognized');
      }
    };

    return { setConfig, isConfigValid, config, allLangs, mode };
  },
});
</script>
<template>
  <div class="flex-1 flex flex-col justify-between min-h-screen">
    <Form layout="vertical">
      <FormItem v-if="mode === 'monitor'" label="Monitor image insertion on this note">
        <Switch v-model:checked="config.isMonitoring" />
      </FormItem>
      <template v-if="mode === 'monitor' && config.isMonitoring">
        <FormItem label="What to do with result text">
          <RadioGroup v-model:value="config.textInsertionType">
            <Radio value="append">Insert After the image</Radio>
            <Radio value="replace">Replace the image</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem required label="Choose language(s) for recognitions">
          <CheckboxGroup :options="allLangs" v-model:value="config.langs" />
        </FormItem>
        <FormItem label="Keeps the space between words">
          <Switch v-model:checked="config.wordSpacePreserved" checkedValue="0" unCheckedValue="1" />
        </FormItem>
        <FormItem label="Result only contains these characters" help="For example: 0123456789">
          <Input v-model:value="config.whitelist" />
        </FormItem>
      </template>
    </Form>
    <div class="text-right">
      <Button class="w-24" type="primary" @click="setConfig" :disabled="!isConfigValid"
        >Confirm</Button
      >
    </div>
  </div>
</template>
