<script setup lang="ts">
import { ref } from "vue";
import {
  FileCode,
  Braces,
  Code,
  Settings,
  File,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
} from "lucide-vue-next";
import type { FileNode } from "@/types/workspace";

const props = defineProps<{
  node: FileNode;
  depth: number;
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [node: FileNode];
  contextmenu: [node: FileNode, event: MouseEvent];
}>();

const expanded = ref(props.node.type === "folder");

function toggle() {
  if (props.node.children) {
    expanded.value = !expanded.value;
  }
}

function handleClick() {
  if (props.node.children) {
    toggle();
  }
  emit("select", props.node);
}

function handleContextMenu(event: MouseEvent) {
  event.preventDefault();
  emit("contextmenu", props.node, event);
}

const iconMap: Record<string, ReturnType<typeof Object.assign>> = {
  ".buelo": FileCode,
  ".json": Braces,
  ".cs": Code,
  ".csx": Code,
  ".bueloproject": Settings,
};

function fileIcon(ext: string) {
  return iconMap[ext] ?? File;
}

const iconColorMap: Record<string, string> = {
  ".buelo": "text-blue-400",
  ".json": "text-yellow-400",
  ".cs": "text-purple-400",
  ".csx": "text-purple-400",
  ".bueloproject": "text-muted-foreground",
};

function iconColor(ext: string): string {
  return iconColorMap[ext] ?? "text-muted-foreground";
}
</script>

<template>
  <div>
    <button
      class="flex items-center gap-1 w-full text-left rounded px-1 py-0.5 text-xs hover:bg-muted transition-colors"
      :class="[
        selectedId === node.id
          ? 'bg-accent/40 text-foreground'
          : 'text-muted-foreground',
      ]"
      :style="{ paddingLeft: `${depth * 12 + 4}px` }"
      @click="handleClick"
      @contextmenu="handleContextMenu"
    >
      <!-- Folder chevron -->
      <span v-if="node.children" class="shrink-0 text-muted-foreground">
        <ChevronDown v-if="expanded" class="size-3" />
        <ChevronRight v-else class="size-3" />
      </span>
      <span v-else class="shrink-0 w-3" />

      <!-- Icon -->
      <component
        :is="
          node.children
            ? expanded
              ? FolderOpen
              : Folder
            : fileIcon(node.extension)
        "
        class="size-3.5 shrink-0"
        :class="
          node.children ? 'text-muted-foreground' : iconColor(node.extension)
        "
      />

      <!-- Name -->
      <span class="truncate min-w-0 flex-1 font-medium">{{ node.name }}</span>
    </button>

    <!-- Children -->
    <div v-if="node.children && expanded">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
        @contextmenu="(n, e) => $emit('contextmenu', n, e)"
      />
    </div>
  </div>
</template>
