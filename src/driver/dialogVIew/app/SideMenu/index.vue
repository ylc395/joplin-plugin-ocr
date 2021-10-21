<script lang="ts">
import { defineComponent, inject } from 'vue';
import { token as resourceToken } from 'domain/service/ResourceService';
import { isUrlResource } from 'domain/model/Resource';

export default defineComponent({
  setup() {
    const { resources, selectResource } = inject(resourceToken)!;

    return { resources, isUrlResource, selectResource };
  },
});
</script>
<template>
  <ol>
    <li
      v-for="(resource, index) of resources"
      :key="isUrlResource(resource) ? resource.url : resource.file.id"
      @click="selectResource(index)"
    >
      {{ isUrlResource(resource) ? resource.url : resource.file.filename }}
    </li>
  </ol>
</template>
