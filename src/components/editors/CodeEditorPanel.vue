<template>
  <ArtefactTabs
    v-model:templateCode="templateCodeModel"
    v-model:jsonData="jsonDataModel"
    class="h-full"
  />
</template>

<script setup lang="ts">
import ArtefactTabs from "./ArtefactTabs.vue";

const templateCodeModel = defineModel<string>("templateCode", { default: "" });
const jsonDataModel = defineModel<string>("jsonData", { default: "" });
</script>
