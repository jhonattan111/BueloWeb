<template>
  <AppLayout>
    <template #sidebar-left>
      <FileTreePanel @open-file="onOpenFile" />
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
import FileTreePanel from "@/components/layout/FileTreePanel.vue";
import CodeEditorPanel from "@/components/editors/CodeEditorPanel.vue";
import PreviewPanel from "@/components/preview/PreviewPanel.vue";
import { useTemplateStore } from "@/stores/templateStore";
import { useActiveTemplate } from "@/composables/useActiveTemplate";
import type { FileNode } from "@/types/workspace";

const store = useTemplateStore();
const { activeFilePath, openGlobalArtefact } = useActiveTemplate();

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

/**
 * FE-13.7 — Wire file selection to editor
 */
async function onOpenFile(node: FileNode) {
  switch (node.type) {
    case "folder":
      // Template folder: activate the template
      store.activeTemplateId = node.id;
      break;

    case "template":
      // Template-scoped file: activate the template and switch to the file
      if (node.parentId) {
        store.activeTemplateId = node.parentId;
        // Give the watcher a tick to seed files, then set path
        await Promise.resolve();
        const filePath = node.id.split(":").slice(1).join(":");
        activeFilePath.value = filePath;
      }
      break;

    case "global-artefact":
      // Load global artefact as a virtual editor tab
      await openGlobalArtefact(node.id);
      break;

    case "project":
      // Project file editor is Sprint 15 — no-op for now
      break;
  }
}
</script>
