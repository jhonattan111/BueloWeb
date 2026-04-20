<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
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
  newFile: [parentId: string];
  close: [];
}>();

const menuRef = ref<HTMLElement | null>(null);

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await nextTick();
      menuRef.value?.focus();
    }
  },
);

function handleOpen() {
  if (props.node) emit("open", props.node);
  emit("close");
}

function handleRename() {
  if (props.node) emit("rename", props.node);
  emit("close");
}

function handleDelete() {
  if (props.node) emit("delete", props.node);
  emit("close");
}

function handleNewFile() {
  if (props.node) emit("newFile", props.node.id);
  emit("close");
}

const isFolder = () => props.node?.type === "folder";
const isGlobalArtefact = () => props.node?.type === "global-artefact";
const isTemplateFile = () => props.node?.type === "template";
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && node"
      ref="menuRef"
      tabindex="-1"
      class="fixed z-50 min-w-[160px] rounded-md border border-border bg-popover shadow-md py-1 text-xs outline-none"
      :style="{ top: `${y}px`, left: `${x}px` }"
      @keydown.escape="$emit('close')"
    >
      <!-- Template folder -->
      <template v-if="isFolder()">
        <button
          class="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
          @click="handleNewFile"
        >
          New file…
        </button>
        <div class="my-1 border-t border-border" />
        <button
          class="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
          @click="handleRename"
        >
          Rename
        </button>
        <button
          class="flex w-full items-center px-3 py-1.5 text-destructive hover:bg-destructive/10 rounded-sm"
          @click="handleDelete"
        >
          Delete
        </button>
      </template>

      <!-- Template artefact -->
      <template v-else-if="isTemplateFile()">
        <button
          class="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
          @click="handleOpen"
        >
          Open
        </button>
        <button
          class="flex w-full items-center px-3 py-1.5 text-destructive hover:bg-destructive/10 rounded-sm"
          @click="handleDelete"
        >
          Delete
        </button>
      </template>

      <!-- Global artefact -->
      <template v-else-if="isGlobalArtefact()">
        <button
          class="flex w-full items-center px-3 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm"
          @click="handleOpen"
        >
          Open
        </button>
        <button
          class="flex w-full items-center px-3 py-1.5 text-destructive hover:bg-destructive/10 rounded-sm"
          @click="handleDelete"
        >
          Delete
        </button>
      </template>
    </div>

    <!-- Click-outside overlay -->
    <div
      v-if="visible"
      class="fixed inset-0 z-40"
      @click="$emit('close')"
      @contextmenu.prevent="$emit('close')"
    />
  </Teleport>
</template>
