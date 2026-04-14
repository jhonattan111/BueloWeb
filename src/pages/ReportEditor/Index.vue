<template>
  <AppLayout>
    <template #sidebar-left>
      <SidebarTemplates />
    </template>

    <template #editor>
      <CodeEditorPanel
        v-model:templateCode="templateCode"
        v-model:jsonData="jsonData"
      />
    </template>

    <template #sidebar-right>
      <PreviewPanel />
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import AppLayout from "@/components/layout/AppLayout.vue";
import SidebarTemplates from "@/components/layout/SidebarTemplates.vue";
import CodeEditorPanel from "@/components/editors/CodeEditorPanel.vue";
import PreviewPanel from "@/components/preview/PreviewPanel.vue";
import { useTemplateStore } from "@/stores/templateStore";

const store = useTemplateStore();

const templateCode = ref<string>("");
const jsonData = ref<string>("");

// Load active template into editors
watch(
  () => store.activeTemplate,
  (t) => {
    if (t) {
      templateCode.value = t.template;
      jsonData.value = JSON.stringify(t.mockData, null, 2);
    }
  },
  { immediate: true },
);

// Persist editor changes back to store (debounced)
const persistChanges = useDebounceFn(() => {
  if (!store.activeTemplateId) return;
  try {
    const parsed = JSON.parse(jsonData.value);
    store.updateTemplate(store.activeTemplateId, {
      template: templateCode.value,
      mockData: parsed,
    });
  } catch {
    // invalid JSON — only persist the template text
    store.updateTemplate(store.activeTemplateId, {
      template: templateCode.value,
    });
  }
}, 500);

watch([templateCode, jsonData], persistChanges);
</script>
