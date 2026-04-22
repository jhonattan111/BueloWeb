<template>
  <AppLayout>
    <template #sidebar-left>
      <div class="flex flex-col h-full min-h-0">
        <!-- Sidebar tab bar -->
        <div class="flex shrink-0 border-b border-border">
          <button
            v-for="tab in sidebarTabs"
            :key="tab.id"
            class="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium uppercase tracking-wider border-b-2 transition-colors"
            :class="
              activeSidebarTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            "
            @click="activeSidebarTab = tab.id"
          >
            <component :is="tab.icon" class="size-3" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Explorer tab -->
        <div
          v-show="activeSidebarTab === 'explorer'"
          class="flex flex-col flex-1 min-h-0"
        >
          <FileTreePanel class="flex-1 min-h-0" @open-file="onOpenFile" />
          <ProjectSettingsPanel />
        </div>

        <!-- Templates tab -->
        <SidebarTemplates
          v-show="activeSidebarTab === 'templates'"
          class="flex-1 min-h-0"
        />
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
      <div
        class="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(180px,34%)]"
      >
        <div class="min-h-0 overflow-hidden border-b border-border">
          <PreviewPanel class="h-full min-h-0" />
        </div>
        <div class="min-h-0 overflow-hidden">
          <FilePropertiesPanel class="h-full min-h-0" />
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { provide, ref } from "vue";
import { FolderOpen, LayoutTemplate } from "lucide-vue-next";
import AppLayout from "@/components/layout/AppLayout.vue";
import FileTreePanel from "@/components/layout/FileTreePanel.vue";
import SidebarTemplates from "@/components/layout/SidebarTemplates.vue";
import ProjectSettingsPanel from "@/components/layout/ProjectSettingsPanel.vue";
import FilePropertiesPanel from "@/components/layout/FilePropertiesPanel.vue";
import CodeEditorPanel from "@/components/editors/CodeEditorPanel.vue";
import ProjectValidationPanel from "@/components/editors/ProjectValidationPanel.vue";
import PreviewPanel from "@/components/preview/PreviewPanel.vue";
import { useActiveTemplate } from "@/composables/useActiveTemplate";
import {
  PROJECT_VALIDATION_KEY,
  useProjectValidation,
} from "@/composables/useProjectValidation";
import { useWorkspaceTree } from "@/composables/useWorkspaceTree";
import { useTemplateStore } from "@/stores/templateStore";
import type { FileNode } from "@/types/workspace";

const { openFile } = useActiveTemplate();
const { tree, selectNode } = useWorkspaceTree();
const projectValidation = useProjectValidation();
const templateStore = useTemplateStore();

provide(PROJECT_VALIDATION_KEY, projectValidation);

// Load templates on mount
templateStore.fetchTemplates();

const templateCode = ref("");
const jsonData = ref("");

// ── Sidebar tabs ──────────────────────────────────────────────────────────────
type SidebarTabId = "explorer" | "templates";
const activeSidebarTab = ref<SidebarTabId>("explorer");
const sidebarTabs = [
  { id: "explorer" as const, label: "Explorer", icon: FolderOpen },
  { id: "templates" as const, label: "Templates", icon: LayoutTemplate },
];

async function onOpenFile(node: FileNode): Promise<void> {
  if (node.type !== "file") return;
  selectNode(node);
  await openFile(node.path);
}

async function onOpenValidationFile(path: string): Promise<void> {
  const node = findNodeByPath(path, tree.value);
  if (!node || node.type !== "file") return;
  selectNode(node);
  await openFile(node.path);
}

function findNodeByPath(path: string, nodes: FileNode[]): FileNode | null {
  const normalized = normalizePath(path);
  for (const node of nodes) {
    if (normalizePath(node.path) === normalized) {
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
