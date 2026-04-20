<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add File</DialogTitle>
        <DialogDescription>
          Choose a file type and where it should live in the template tree.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 py-2">
        <!-- Type select -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium">Type</label>
          <select
            v-model="selectedTypeKind"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option v-for="t in FILE_TYPES" :key="t.kind" :value="t.kind">
              {{ t.label }}
            </option>
          </select>
        </div>

        <!-- Directory input -->
        <div v-if="!selectedType.fixedPath" class="flex flex-col gap-1.5">
          <label class="text-xs font-medium">Directory (optional)</label>
          <Input
            v-model="directory"
            placeholder="e.g. helpers/tax"
            :class="directoryError ? 'border-destructive' : ''"
          />
          <p v-if="directoryError" class="text-xs text-destructive">
            {{ directoryError }}
          </p>
        </div>

        <!-- Name input -->
        <div v-if="selectedType.requiresName" class="flex flex-col gap-1.5">
          <label class="text-xs font-medium">Name</label>
          <Input
            v-model="name"
            placeholder="e.g. invoice"
            :class="nameError ? 'border-destructive' : ''"
            @keydown.enter="confirm"
          />
          <p v-if="nameError" class="text-xs text-destructive">
            {{ nameError }}
          </p>
          <p class="text-xs text-muted-foreground">
            File will be saved as <code>{{ preview }}</code>
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)"
          >Cancel</Button
        >
        <Button :disabled="isConfirmDisabled" @click="confirm">Add</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

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
import type { TemplateFileKind, TemplateMode } from "@/types/template";

type FileTypeOption = {
  label: string;
  kind: TemplateFileKind;
  extension: string;
  requiresName: boolean;
  fixedPath?: string;
  mode?: TemplateMode;
  defaultContent: string;
};

const FILE_TYPES: FileTypeOption[] = [
  {
    label: "Template file (Sections)",
    kind: "template-sections",
    extension: ".sections.cs",
    requiresName: true,
    mode: "Sections",
    defaultContent: 'page.Content().Text("Hello from sections file");\n',
  },
  {
    label: "Template file (Partial)",
    kind: "template-partial",
    extension: ".partial.cs",
    requiresName: true,
    mode: "Partial",
    defaultContent: '.Text("Shared partial snippet");\n',
  },
  {
    label: "Data File (.data.json)",
    kind: "data",
    extension: ".data.json",
    requiresName: true,
    defaultContent: "{}\n",
  },
  {
    label: "Helper (.helpers.cs)",
    kind: "helper",
    extension: ".helpers.cs",
    requiresName: true,
    defaultContent: "public static string Example(string value) => value;\n",
  },
  {
    label: "Schema (.schema.json)",
    kind: "schema",
    extension: ".schema.json",
    requiresName: true,
    defaultContent: '{\n  "type": "object"\n}\n',
  },
  {
    label: "C# File (.cs)",
    kind: "file",
    extension: ".cs",
    requiresName: true,
    defaultContent: "// Add custom C# code\n",
  },
] as const;

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  add: [
    payload: {
      path: string;
      content: string;
      kind: TemplateFileKind;
      mode?: TemplateMode;
    },
  ];
}>();

const name = ref("");
const directory = ref("");
const selectedTypeKind = ref<TemplateFileKind>(FILE_TYPES[0].kind);

const selectedType = computed(
  () =>
    FILE_TYPES.find((t) => t.kind === selectedTypeKind.value) ?? FILE_TYPES[0],
);

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const DIR_RE = /^[a-z0-9][a-z0-9\/-]*$/;

const nameError = computed(() => {
  if (!selectedType.value.requiresName) return null;
  if (!name.value) return null;
  return SLUG_RE.test(name.value)
    ? null
    : "Only lowercase letters, digits, and hyphens allowed.";
});

const directoryError = computed(() => {
  if (!directory.value) return null;
  return DIR_RE.test(directory.value)
    ? null
    : "Use lowercase letters, digits, hyphens and / only.";
});

const preview = computed(() => resolvePath() ?? "…");

const isConfirmDisabled = computed(() => {
  if (directoryError.value || nameError.value) return true;
  if (selectedType.value.requiresName && !name.value) return true;
  return resolvePath() === null;
});

// Reset on open
watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = "";
      directory.value = "";
      selectedTypeKind.value = FILE_TYPES[0].kind;
    }
  },
);

function confirm() {
  const path = resolvePath();
  if (!path || isConfirmDisabled.value) return;

  emit("add", {
    path,
    content: selectedType.value.defaultContent,
    kind: selectedType.value.kind,
    ...(selectedType.value.mode ? { mode: selectedType.value.mode } : {}),
  });
  emit("update:open", false);
}

function resolvePath(): string | null {
  if (!name.value) return null;

  const dir = directory.value
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+|\/+$/g, "");
  const fileName = `${name.value}${selectedType.value.extension}`;
  return dir ? `${dir}/${fileName}` : fileName;
}
</script>
