<template>
  <AppLayout>
    <template #sidebar-left>
      <div class="flex flex-col h-full min-h-0">
        <FileTreePanel class="flex-1 min-h-0" @open-file="onOpenFile" />
        <ProjectSettingsPanel />
      </div>
    </template>

    <template #editor>
      <div class="relative h-full min-h-0">
        <CodeEditorPanel
          v-model:templateCode="templateCode"
          v-model:jsonData="jsonData"
        />
        <ProjectValidationPanel
          :result="projectValidation.result.value"
          :is-validating="projectValidation.isValidating.value"
          :error="projectValidation.error.value"
          :open="projectValidation.panelOpen.value"
          @close="projectValidation.panelOpen.value = false"
          @open-file="onOpenValidationFile"
        />
      </div>
    </template>

    <template #sidebar-right>
      <PreviewPanel />
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { provide, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import AppLayout from "@/components/layout/AppLayout.vue";
import FileTreePanel from "@/components/layout/FileTreePanel.vue";
import ProjectSettingsPanel from "@/components/layout/ProjectSettingsPanel.vue";
import CodeEditorPanel from "@/components/editors/CodeEditorPanel.vue";
import ProjectValidationPanel from "@/components/editors/ProjectValidationPanel.vue";
import PreviewPanel from "@/components/preview/PreviewPanel.vue";
import { useTemplateStore } from "@/stores/templateStore";
import { useActiveTemplate } from "@/composables/useActiveTemplate";
import {
  PROJECT_VALIDATION_KEY,
  useProjectValidation,
} from "@/composables/useProjectValidation";
import { useWorkspaceTree } from "@/composables/useWorkspaceTree";
import type { FileNode } from "@/types/workspace";

const store = useTemplateStore();
const { activeFilePath, openGlobalArtefact } = useActiveTemplate();
const { tree } = useWorkspaceTree();
const projectValidation = useProjectValidation();

provide(PROJECT_VALIDATION_KEY, projectValidation);

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
  }
}

async function onOpenValidationFile(path: string) {
  const node = findNodeByPath(path, tree.value);
  if (!node) return;
  await onOpenFile(node);
}

function findNodeByPath(path: string, nodes: FileNode[]): FileNode | null {
  const normalizedPath = normalizePath(path);
  const fileName = normalizedPath.split("/").at(-1);

  for (const node of nodes) {
    const nodePath = normalizePath(node.path);
    if (nodePath && nodePath === normalizedPath) {
      return node;
    }

    if (fileName && node.name === fileName && node.type !== "folder") {
      return node;
    }

    if (node.children?.length) {
      const nested = findNodeByPath(path, node.children);
      if (nested) return nested;
    }
  }

  return null;
}

function normalizePath(path: string | undefined): string {
  return (path ?? "").replace(/\\/g, "/").trim();
}
</script>
