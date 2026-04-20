<script setup lang="ts">
import { ref } from "vue";
import { FolderPlus, Plus, RefreshCw } from "lucide-vue-next";
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
import FileTreeContextMenu from "./FileTreeContextMenu.vue";
import FileTreeNode from "./FileTreeNode.vue";
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
  validationState,
  refresh,
  selectNode,
  deleteNode,
  renameNode,
  createFolder,
} = useWorkspaceTree();

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  node: null as FileNode | null,
});

const newFileDialog = ref({ open: false, parentPath: null as string | null });
const newFolderDialog = ref({
  open: false,
  parentPath: null as string | null,
  name: "",
});
const deleteDialog = ref({ open: false, node: null as FileNode | null });
const renameDialog = ref({
  open: false,
  node: null as FileNode | null,
  value: "",
});

function onContextMenu(node: FileNode, event: MouseEvent): void {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    node,
  };
}

function closeContextMenu(): void {
  contextMenu.value.visible = false;
}

function handleNodeSelect(node: FileNode): void {
  selectNode(node);
  if (node.type === "file") {
    emit("openFile", node);
  }
}

function openNewFile(parentPath: string | null = null): void {
  newFileDialog.value = { open: true, parentPath };
}

function openNewFolder(parentPath: string | null = null): void {
  newFolderDialog.value = { open: true, parentPath, name: "" };
}

async function confirmNewFolder(): Promise<void> {
  const name = newFolderDialog.value.name.trim();
  if (!name) return;
  await createFolder(newFolderDialog.value.parentPath, name);
  newFolderDialog.value = { open: false, parentPath: null, name: "" };
}

function requestDelete(node: FileNode): void {
  deleteDialog.value = { open: true, node };
}

async function confirmDelete(): Promise<void> {
  if (!deleteDialog.value.node) return;
  await deleteNode(deleteDialog.value.node);
  deleteDialog.value = { open: false, node: null };
}

function requestRename(node: FileNode): void {
  const defaultValue =
    node.type === "file"
      ? node.name.replace(
          new RegExp(`${node.extension.replace(".", "\\.")}$$`, "i"),
          "",
        )
      : node.name;

  renameDialog.value = {
    open: true,
    node,
    value: defaultValue,
  };
}

async function confirmRename(): Promise<void> {
  const node = renameDialog.value.node;
  const value = renameDialog.value.value.trim();
  if (!node || !value) return;

  const nextName =
    node.type === "file" && node.extension && !value.endsWith(node.extension)
      ? `${value}${node.extension}`
      : value;

  await renameNode(node, nextName);
  renameDialog.value = { open: false, node: null, value: "" };
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
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
          aria-label="New folder"
          @click="openNewFolder(null)"
        >
          <FolderPlus class="size-4" />
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

    <ScrollArea class="flex-1 min-h-0">
      <div class="p-1">
        <template v-if="isLoading && tree.length === 0">
          <div
            v-for="n in 5"
            :key="n"
            class="h-6 rounded bg-muted animate-pulse mb-1"
          />
        </template>

        <template v-else-if="tree.length === 0">
          <div class="px-2 py-4 text-center">
            <p class="text-xs text-muted-foreground mb-2">
              Workspace is empty.
            </p>
            <div class="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" @click="openNewFolder(null)"
                >New folder</Button
              >
              <Button size="sm" @click="openNewFile(null)">New file</Button>
            </div>
          </div>
        </template>

        <template v-else>
          <FileTreeNode
            v-for="node in tree"
            :key="node.id"
            :node="node"
            :depth="0"
            :selected-id="selectedNode?.id ?? null"
            :validation-state="validationState"
            @select="handleNodeSelect"
            @contextmenu="(nodeValue, event) => onContextMenu(nodeValue, event)"
          />
        </template>
      </div>
    </ScrollArea>

    <FileTreeContextMenu
      :node="contextMenu.node"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :visible="contextMenu.visible"
      @open="(node) => emit('openFile', node)"
      @rename="requestRename"
      @delete="requestDelete"
      @new-file="openNewFile"
      @new-folder="openNewFolder"
      @close="closeContextMenu"
    />

    <AlertDialog
      :open="deleteDialog.open"
      @update:open="deleteDialog.open = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            >Delete "{{ deleteDialog.node?.name }}"?</AlertDialogTitle
          >
          <AlertDialogDescription
            >This action cannot be undone.</AlertDialogDescription
          >
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteDialog.open = false"
            >Cancel</AlertDialogCancel
          >
          <AlertDialogAction @click="confirmDelete">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog :open="renameDialog.open" @update:open="renameDialog.open = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
          <DialogDescription>Enter a new name for this node.</DialogDescription>
        </DialogHeader>
        <Input
          v-model="renameDialog.value"
          placeholder="New name"
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

    <Dialog
      :open="newFolderDialog.open"
      @update:open="newFolderDialog.open = $event"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription
            >Create a folder in the workspace tree.</DialogDescription
          >
        </DialogHeader>
        <Input
          v-model="newFolderDialog.name"
          placeholder="Folder name"
          @keydown.enter="confirmNewFolder"
        />
        <DialogFooter>
          <Button variant="outline" @click="newFolderDialog.open = false"
            >Cancel</Button
          >
          <Button
            :disabled="!newFolderDialog.name.trim()"
            @click="confirmNewFolder"
            >Create</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <NewFileDialog
      v-model:open="newFileDialog.open"
      :default-parent-path="newFileDialog.parentPath"
      @created="(node) => emit('openFile', node)"
    />
  </div>
</template>
