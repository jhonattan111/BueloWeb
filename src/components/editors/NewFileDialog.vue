<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspaceTree } from "@/composables/useWorkspaceTree";
import { BUELO_STARTER_TEMPLATE } from "@/lib/buelo-language/snippets";
import type { FileNode } from "@/types/workspace";

interface FileTypeOption {
  label: string;
  extension: string;
  defaultContent?: string;
}

const FILE_TYPES: FileTypeOption[] = [
  {
    label: "Report (.buelo)",
    extension: ".buelo",
    defaultContent: BUELO_STARTER_TEMPLATE,
  },
  { label: "Data (.json)", extension: ".json", defaultContent: "{\n  \n}\n" },
  { label: "Helper Script (.csx)", extension: ".csx" },
  { label: "Helper Class (.cs)", extension: ".cs" },
  { label: "Generic file", extension: "" },
];

const props = defineProps<{
  open: boolean;
  defaultParentPath?: string | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  created: [node: FileNode];
}>();

const { tree, createFile } = useWorkspaceTree();

const name = ref("");
const selectedTypeIndex = ref(0);
const selectedFolderPath = ref<string | null>(props.defaultParentPath ?? null);
const customExtension = ref("");

watch(
  () => props.defaultParentPath,
  (value) => {
    selectedFolderPath.value = value ?? null;
  },
);

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    name.value = "";
    selectedTypeIndex.value = 0;
    customExtension.value = "";
    selectedFolderPath.value = props.defaultParentPath ?? null;
  },
);

const selectedType = computed(() => FILE_TYPES[selectedTypeIndex.value]);

const folders = computed(() => {
  const list: Array<{ path: string; label: string }> = [];

  function visit(nodes: FileNode[]): void {
    for (const node of nodes) {
      if (node.type === "folder") {
        list.push({ path: node.path, label: node.path });
        if (node.children?.length) {
          visit(node.children);
        }
      }
    }
  }

  visit(tree.value);
  return list.sort((a, b) => a.path.localeCompare(b.path));
});

const finalExtension = computed(() => {
  if (selectedType.value.extension) return selectedType.value.extension;
  const typed = customExtension.value.trim();
  if (!typed) return "";
  return typed.startsWith(".") ? typed : `.${typed}`;
});

const previewName = computed(() => {
  const base = name.value.trim();
  if (!base) return "";
  return `${base}${finalExtension.value}`;
});

const validationError = computed(() => {
  const base = name.value.trim();
  if (!base) return "Name is required.";
  if (!/^[\w\- .]+$/.test(base)) return "Name contains invalid characters.";
  if (selectedType.value.extension === "" && !finalExtension.value) {
    return "Provide a custom extension for generic files.";
  }
  return null;
});

const canCreate = computed(() => validationError.value === null);

async function confirm(): Promise<void> {
  if (!canCreate.value) return;

  const extension = finalExtension.value;
  const content = selectedType.value.defaultContent ?? "";
  const node = await createFile(
    selectedFolderPath.value,
    name.value.trim(),
    extension,
    content,
  );
  emit("created", node);
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>New File</DialogTitle>
        <DialogDescription
          >Create a file in the selected workspace folder.</DialogDescription
        >
      </DialogHeader>

      <div class="flex flex-col gap-3 py-2">
        <div class="space-y-1.5">
          <label class="text-xs font-medium">Target folder</label>
          <select
            v-model="selectedFolderPath"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option :value="null">/ (workspace root)</option>
            <option
              v-for="folder in folders"
              :key="folder.path"
              :value="folder.path"
            >
              {{ folder.label }}
            </option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium">Type</label>
          <select
            v-model="selectedTypeIndex"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option
              v-for="(type, index) in FILE_TYPES"
              :key="type.label"
              :value="index"
            >
              {{ type.label }}
            </option>
          </select>
        </div>

        <div v-if="selectedType.extension === ''" class="space-y-1.5">
          <label class="text-xs font-medium">Custom extension</label>
          <Input v-model="customExtension" placeholder="txt" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium">File name</label>
          <Input
            v-model="name"
            placeholder="invoice"
            @keydown.enter="confirm"
          />
          <p v-if="previewName" class="text-xs text-muted-foreground">
            Will be created as {{ previewName }}
          </p>
          <p v-if="validationError" class="text-xs text-destructive">
            {{ validationError }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)"
          >Cancel</Button
        >
        <Button :disabled="!canCreate" @click="confirm">Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
