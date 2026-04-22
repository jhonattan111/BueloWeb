<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Braces,
  ChevronDown,
  ChevronRight,
  File,
  FileCode,
  Folder,
  FolderOpen,
} from "lucide-vue-next";
import type { FileNode } from "@/types/workspace";
import type { FileValidationResult } from "@/types/template";

const props = defineProps<{
  node: FileNode;
  depth: number;
  selectedId: string | null;
  validationState?: Map<string, FileValidationResult>;
}>();

const emit = defineEmits<{
  select: [node: FileNode];
  contextmenu: [node: FileNode, event: MouseEvent];
}>();

const expanded = ref(props.node.type === "folder");

function onClick(): void {
  if (props.node.type === "folder") {
    expanded.value = !expanded.value;
  }
  emit("select", props.node);
}

function onContextMenu(event: MouseEvent): void {
  event.preventDefault();
  emit("contextmenu", props.node, event);
}

function fileIcon(extension: string) {
  const normalized = extension.toLowerCase();
  if (normalized === ".cs" || normalized === ".csx") return FileCode;
  if (normalized === ".json") return Braces;
  return File;
}

function iconColor(extension: string): string {
  const normalized = extension.toLowerCase();
  if (normalized === ".cs" || normalized === ".csx") return "text-blue-400";
  if (normalized === ".json") return "text-amber-400";
  return "text-muted-foreground";
}

function normalizePath(path: string | undefined): string {
  return (path ?? "").replace(/\\/g, "/").trim();
}

const ownBadge = computed<"error" | "warning" | null>(() => {
  if (!props.validationState) return null;
  const byPath = props.validationState.get(normalizePath(props.node.path));
  const byId = props.validationState.get(props.node.id);
  const result = byPath ?? byId;
  if (!result) return null;
  if (result.errors.length > 0) return "error";
  if (result.warnings.length > 0) return "warning";
  return null;
});

const childrenBadge = computed<"error" | "warning" | null>(() => {
  if (!props.validationState || props.node.type !== "folder") return null;

  const folderPath = normalizePath(props.node.path);
  let warning = false;
  for (const [key, value] of props.validationState.entries()) {
    if (!key.startsWith(`${folderPath}/`)) continue;
    if (value.errors.length > 0) return "error";
    if (value.warnings.length > 0) warning = true;
  }

  return warning ? "warning" : null;
});

const badge = computed(() => ownBadge.value ?? childrenBadge.value);
</script>

<template>
  <div>
    <button
      class="flex items-center gap-1 w-full text-left rounded px-1 py-0.5 text-xs hover:bg-muted transition-colors"
      :class="
        selectedId === node.id
          ? 'bg-accent/40 text-foreground'
          : 'text-muted-foreground'
      "
      :style="{ paddingLeft: `${depth * 12 + 4}px` }"
      @click="onClick"
      @contextmenu="onContextMenu"
    >
      <span
        v-if="node.type === 'folder'"
        class="shrink-0 text-muted-foreground"
      >
        <ChevronDown v-if="expanded" class="size-3" />
        <ChevronRight v-else class="size-3" />
      </span>
      <span v-else class="shrink-0 w-3" />

      <component
        :is="
          node.type === 'folder'
            ? expanded
              ? FolderOpen
              : Folder
            : fileIcon(node.extension)
        "
        class="size-3.5 shrink-0"
        :class="
          node.type === 'folder'
            ? 'text-muted-foreground'
            : iconColor(node.extension)
        "
      />

      <span class="truncate min-w-0 flex-1 font-medium">{{ node.name }}</span>

      <span
        v-if="badge === 'error'"
        class="shrink-0 w-1.5 h-1.5 rounded-full bg-destructive"
      />
      <span
        v-else-if="badge === 'warning'"
        class="shrink-0 w-1.5 h-1.5 rounded-full bg-yellow-500"
      />
    </button>

    <div v-if="node.type === 'folder' && expanded">
      <FileTreeNode
        v-for="child in node.children ?? []"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :validation-state="validationState"
        @select="$emit('select', $event)"
        @contextmenu="
          (nodeValue, event) => $emit('contextmenu', nodeValue, event)
        "
      />
    </div>
  </div>
</template>
