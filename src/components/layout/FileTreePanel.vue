<script setup lang="ts">
import { ref } from "vue";
import { RefreshCw, Plus } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import FileTreeNode from "./FileTreeNode.vue";
import FileTreeContextMenu from "./FileTreeContextMenu.vue";
import NewFileDialog from "@/components/editors/NewFileDialog.vue";
import { useWorkspaceTree } from "@/composables/useWorkspaceTree";
import type { FileNode } from "@/types/workspace";

const emit = defineEmits<{
  openFile: [node: FileNode];
}>();

const {
  tree,
  isLoading,
  selectedNode,
  refresh,
  selectNode,
  deleteFile,
  renameTemplate,
} = useWorkspaceTree();

// ── Context menu ──────────────────────────────────────────────────────────────
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  node: null as FileNode | null,
});

function onContextMenu(node: FileNode, event: MouseEvent) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    node,
  };
}

function closeContextMenu() {
  contextMenu.value.visible = false;
}

// ── Open file ─────────────────────────────────────────────────────────────────
function handleOpen(node: FileNode) {
  selectNode(node);
  emit("openFile", node);
}

function handleNodeSelect(node: FileNode) {
  selectNode(node);
  if (node.type !== "folder") {
    emit("openFile", node);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteDialog = ref({ open: false, node: null as FileNode | null });

function requestDelete(node: FileNode) {
  deleteDialog.value = { open: true, node };
}

async function confirmDelete() {
  if (!deleteDialog.value.node) return;
  await deleteFile(deleteDialog.value.node);
  deleteDialog.value = { open: false, node: null };
}

// ── Rename ────────────────────────────────────────────────────────────────────
const renameDialog = ref({
  open: false,
  node: null as FileNode | null,
  value: "",
});

function requestRename(node: FileNode) {
  renameDialog.value = {
    open: true,
    node,
    value: node.name.replace(/\.buelo$/, ""),
  };
}

async function confirmRename() {
  const { node, value } = renameDialog.value;
  if (!node || !value.trim()) return;
  await renameTemplate(node, value.trim());
  renameDialog.value = { open: false, node: null, value: "" };
}

// ── New file ──────────────────────────────────────────────────────────────────
const newFileDialog = ref({ open: false, parentId: null as string | null });

function openNewFile(parentId: string | null = null) {
  newFileDialog.value = { open: true, parentId };
}

function onContextNewFile(parentId: string) {
  // parentId from context menu is the folder (template) node id
  openNewFile(parentId);
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-3 h-10 shrink-0 border-b border-border"
    >
      <span
        class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        Explorer
      </span>
      <div class="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh"
          :disabled="isLoading"
          @click="refresh()"
        >
          <RefreshCw
            class="size-3.5"
            :class="isLoading ? 'animate-spin' : ''"
          />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New file"
          @click="openNewFile(null)"
        >
          <Plus class="size-4" />
        </Button>
      </div>
    </div>

    <!-- Tree -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="p-1">
        <!-- Loading skeleton -->
        <template v-if="isLoading && tree.length === 0">
          <div
            v-for="n in 4"
            :key="n"
            class="h-6 rounded bg-muted animate-pulse mb-1"
          />
        </template>

        <!-- Empty state -->
        <template v-else-if="tree.length === 0">
          <div class="px-2 py-4 text-center">
            <p class="text-xs text-muted-foreground mb-2">
              No files yet. Create a new template to get started.
            </p>
            <Button size="sm" @click="openNewFile(null)">New template</Button>
          </div>
        </template>

        <!-- Tree nodes -->
        <template v-else>
          <FileTreeNode
            v-for="node in tree"
            :key="node.id"
            :node="node"
            :depth="0"
            :selected-id="selectedNode?.id ?? null"
            @select="handleNodeSelect"
            @contextmenu="(n, e) => onContextMenu(n, e)"
          />
        </template>
      </div>
    </ScrollArea>

    <!-- Context menu -->
    <FileTreeContextMenu
      :node="contextMenu.node"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :visible="contextMenu.visible"
      @open="handleOpen"
      @rename="requestRename"
      @delete="requestDelete"
      @new-file="onContextNewFile"
      @close="closeContextMenu"
    />

    <!-- Delete confirmation -->
    <AlertDialog
      :open="deleteDialog.open"
      @update:open="deleteDialog.open = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            >Delete "{{ deleteDialog.node?.name }}"?</AlertDialogTitle
          >
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteDialog.open = false"
            >Cancel</AlertDialogCancel
          >
          <AlertDialogAction @click="confirmDelete">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Rename dialog -->
    <Dialog :open="renameDialog.open" @update:open="renameDialog.open = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Template</DialogTitle>
          <DialogDescription
            >Enter a new name for this template.</DialogDescription
          >
        </DialogHeader>
        <Input
          v-model="renameDialog.value"
          placeholder="Template name"
          @keydown.enter="confirmRename"
        />
        <DialogFooter>
          <Button variant="outline" @click="renameDialog.open = false"
            >Cancel</Button
          >
          <Button :disabled="!renameDialog.value.trim()" @click="confirmRename"
            >Rename</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- New file dialog -->
    <NewFileDialog
      v-model:open="newFileDialog.open"
      :default-parent-id="newFileDialog.parentId"
      @created="
        (node) => {
          selectNode(node);
          emit('openFile', node);
        }
      "
    />
  </div>
</template>
