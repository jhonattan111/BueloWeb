<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { FileNode } from "@/types/workspace";

const props = defineProps<{
  node: FileNode | null;
  x: number;
  y: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  open: [node: FileNode];
  rename: [node: FileNode];
  delete: [node: FileNode];
  newFile: [parentPath: string | null];
  newFolder: [parentPath: string | null];
  close: [];
}>();

const menuRef = ref<HTMLElement | null>(null);

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return;
    await nextTick();
    menuRef.value?.focus();
  },
);

const isFolder = () => props.node?.type === "folder";

function openNode(): void {
  if (props.node) emit("open", props.node);
  emit("close");
}

function renameNode(): void {
  if (props.node) emit("rename", props.node);
  emit("close");
}

function deleteNode(): void {
  if (props.node) emit("delete", props.node);
  emit("close");
}

function createFile(): void {
  emit("newFile", isFolder() ? (props.node?.path ?? null) : null);
  emit("close");
}

function createFolder(): void {
  emit("newFolder", isFolder() ? (props.node?.path ?? null) : null);
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      tabindex="-1"
      class="fixed z-50 min-w-[180px] rounded-md border border-border bg-popover shadow-md py-1 text-xs outline-none"
      :style="{ top: `${y}px`, left: `${x}px` }"
      @keydown.escape="$emit('close')"
    >
      <button
        class="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
        @click="createFile"
      >
        New File...
      </button>
      <button
        class="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
        @click="createFolder"
      >
        New Folder...
      </button>

      <template v-if="node && node.type === 'file'">
        <div class="my-1 border-t border-border" />
        <button
          class="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
          @click="openNode"
        >
          Open
        </button>
      </template>

      <template v-if="node">
        <div class="my-1 border-t border-border" />
        <button
          class="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
          @click="renameNode"
        >
          Rename
        </button>
        <button
          class="flex w-full items-center px-3 py-1.5 text-destructive hover:bg-destructive/10 rounded-sm"
          @click="deleteNode"
        >
          Delete
        </button>
      </template>
    </div>

    <div
      v-if="visible"
      class="fixed inset-0 z-40"
      @click="$emit('close')"
      @contextmenu.prevent="$emit('close')"
    />
  </Teleport>
</template>
