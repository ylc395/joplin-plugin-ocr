<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Checkbox, FormItem, Switch, Input, Button, Form, Radio, message } from 'ant-design-vue';
import { MonitorOutlined } from '@ant-design/icons-vue';
import { TextInsertionType } from 'domain/model/Recognition';
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
    MonitorOutlined,
  },
  setup() {
    const { monitorService } = inject(resourceToken)!;

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

    return { setConfig, isConfigValid, config, allLangs, TextInsertionType };
  },
});
</script>
<template>
  <div class="flex">
    <div class="w-60 mr-4 text-center flex flex-col justify-center text-gray-400">
      <MonitorOutlined class="text-4xl mb-5" />
      <p class="my-0">Auto Image Recognition</p>
      <p class="my-0">For Current Note</p>
    </div>
    <div class="flex-1 flex flex-col justify-between min-h-screen">
      <Form layout="vertical">
        <FormItem
          class="mb-4"
          label="Monitor image insertion on this note"
          :help="`Existing and future image will${
            config.isMonitoring ? '' : ' not'
          } be auto recognized`"
        >
          <Switch v-model:checked="config.isMonitoring" />
        </FormItem>
        <template v-if="config.isMonitoring">
          <FormItem
            class="mb-4"
            label="How to display result"
            help="All will modify your note by inserting text as image's title"
          >
            <RadioGroup v-model:value="config.textInsertionType">
              <Radio :value="TextInsertionType.Append">Insert After the image</Radio>
              <Radio :value="TextInsertionType.RealReplace"
                >Replace the image(remove image on origin note)</Radio
              >
              <Radio :value="TextInsertionType.Replace"
                >Replace the image(but keep image on original note)</Radio
              >
            </RadioGroup>
          </FormItem>
          <FormItem required label="Choose language(s) for recognitions">
            <CheckboxGroup :options="allLangs" v-model:value="config.langs" />
          </FormItem>
          <FormItem label="Keeps the space between words">
            <Switch
              v-model:checked="config.wordSpacePreserved"
              checkedValue="0"
              unCheckedValue="1"
            />
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
  </div>
</template>
