<script setup lang="ts">
import { ref, computed, watch } from "vue";
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
import { useTemplateStore } from "@/stores/templateStore";
import { BUELO_STARTER_TEMPLATE } from "@/lib/buelo-language/snippets";
import type { FileNode, FileNodeType } from "@/types/workspace";

interface FileTypeOption {
  label: string;
  extension: string;
  nodeType: FileNodeType;
  defaultParentRequired: boolean;
  defaultContent?: string;
}

const FILE_TYPES: FileTypeOption[] = [
  {
    label: "Report (.buelo)",
    extension: ".buelo",
    nodeType: "template",
    defaultParentRequired: false,
    defaultContent: BUELO_STARTER_TEMPLATE,
  },
  {
    label: "Data (.json)",
    extension: ".json",
    nodeType: "template",
    defaultParentRequired: false,
  },
  {
    label: "Helper (.csx)",
    extension: ".csx",
    nodeType: "template",
    defaultParentRequired: false,
  },
  {
    label: "Helper class (.cs)",
    extension: ".cs",
    nodeType: "template",
    defaultParentRequired: false,
  },
  {
    label: "Global artefact (.json)",
    extension: ".json",
    nodeType: "global-artefact",
    defaultParentRequired: false,
  },
  {
    label: "Global artefact (.csx)",
    extension: ".csx",
    nodeType: "global-artefact",
    defaultParentRequired: false,
  },
];

const props = defineProps<{
  open: boolean;
  defaultParentId?: string | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  created: [node: FileNode];
}>();

const templateStore = useTemplateStore();
const { createFile } = useWorkspaceTree();

const name = ref("");
const selectedTypeIndex = ref(0);
const selectedParentId = ref<string | null>(props.defaultParentId ?? null);

watch(
  () => props.defaultParentId,
  (val) => {
    selectedParentId.value = val ?? null;
  },
);

watch(
  () => props.open,
  (val) => {
    if (val) {
      name.value = "";
      selectedTypeIndex.value = 0;
      selectedParentId.value = props.defaultParentId ?? null;
    }
  },
);

const selectedType = computed(() => FILE_TYPES[selectedTypeIndex.value]);

const nameError = computed(() => {
  if (!name.value.trim()) return null;
  if (!/^[\w\- .]+$/.test(name.value.trim()))
    return "Name contains invalid characters.";
  return null;
});

const isValid = computed(
  () => name.value.trim().length > 0 && !nameError.value,
);

const previewName = computed(() =>
  name.value.trim()
    ? `${name.value.trim()}${selectedType.value.extension}`
    : "",
);

const templates = computed(() => templateStore.templates);

async function confirm() {
  if (!isValid.value) return;

  const isGlobal = selectedType.value.nodeType === "global-artefact";
  const parentId = isGlobal ? null : selectedParentId.value;

  try {
    const node = await createFile(
      parentId,
      name.value.trim(),
      selectedType.value.extension,
      selectedType.value.defaultContent ?? "",
    );
    emit("created", node);
    emit("update:open", false);
  } catch (err) {
    // Surface errors through the store or a local error ref if needed
    console.error(err);
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>New File</DialogTitle>
        <DialogDescription
          >Create a new file in the workspace.</DialogDescription
        >
      </DialogHeader>

      <div class="flex flex-col gap-3 py-2">
        <!-- File name -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium">File name</label>
          <Input
            v-model="name"
            placeholder="e.g. invoice"
            :class="nameError ? 'border-destructive' : ''"
            @keydown.enter="confirm"
          />
          <p v-if="nameError" class="text-xs text-destructive">
            {{ nameError }}
          </p>
          <p v-if="previewName" class="text-xs text-muted-foreground">
            Will be saved as <code>{{ previewName }}</code>
          </p>
        </div>

        <!-- File type -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium">Type</label>
          <select
            v-model="selectedTypeIndex"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option v-for="(t, idx) in FILE_TYPES" :key="idx" :value="idx">
              {{ t.label }}
            </option>
          </select>
        </div>

        <!-- Parent template (only for template-scoped types) -->
        <div
          v-if="selectedType.nodeType === 'template'"
          class="flex flex-col gap-1.5"
        >
          <label class="text-xs font-medium">Parent template (optional)</label>
          <select
            v-model="selectedParentId"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option :value="null">— None (global artefact) —</option>
            <option v-for="t in templates" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)"
          >Cancel</Button
        >
        <Button :disabled="!isValid" @click="confirm">Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
