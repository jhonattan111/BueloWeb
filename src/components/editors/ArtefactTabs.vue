<template>
  <div class="flex flex-col h-full min-h-0 bg-muted/30">
    <div
      class="flex items-center gap-2 px-2 h-10 shrink-0 border-b border-border overflow-x-auto"
    >
      <button
        v-for="path in openPaths"
        :key="path"
        type="button"
        class="group inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs"
        :class="
          activeFilePath === path
            ? 'bg-accent text-accent-foreground border-border'
            : 'bg-background/60 text-muted-foreground border-transparent hover:bg-muted'
        "
        @click="switchToFile(path)"
      >
        <span class="max-w-[26ch] truncate" :title="path">{{
          fileName(path)
        }}</span>
        <span
          v-if="isDirty(path)"
          class="inline-block size-1.5 rounded-full bg-amber-500"
          title="Unsaved"
        />
        <button
          type="button"
          class="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-muted-foreground/20"
          @click.stop="closeFile(path)"
        >
          ×
        </button>
      </button>

      <div class="flex-1 min-w-2" />

      <span
        v-if="diagnosticState === 'validating'"
        class="text-muted-foreground text-xs animate-spin inline-block"
        title="Validating..."
        >⟳</span
      >
      <span
        v-else-if="diagnosticState === 'error'"
        class="text-destructive text-xs"
        :title="projectValidationError || 'Validation errors'"
        >✕</span
      >
      <span
        v-else-if="diagnosticState === 'ok'"
        class="text-xs"
        style="color: #4ade80"
        title="No errors"
        >✓</span
      >
      <span v-else class="text-muted-foreground text-xs" title="Not validated"
        >-</span
      >

      <Button
        size="sm"
        variant="ghost"
        :disabled="isProjectValidating"
        class="shrink-0 text-xs px-2 h-6"
        @click="runProjectValidation"
      >
        <span v-if="isProjectValidating">Validating...</span>
        <span v-else>Validate Project</span>
      </Button>

      <Button
        size="sm"
        :disabled="reportStore.isRendering || !canRenderActive"
        class="shrink-0"
        :title="
          canRenderActive
            ? 'Render active file'
            : 'Render is available only for .buelo tabs'
        "
        @click="onRender"
      >
        <span v-if="reportStore.isRendering">Rendering...</span>
        <span v-else>Render</span>
      </Button>
    </div>

    <div class="flex-1 min-h-0 relative">
      <div
        v-if="!activeFile"
        class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
      >
        Open a file from the tree to start editing.
      </div>

      <div v-else-if="activeExtension === '.buelo'" class="absolute inset-0">
        <TemplateEditor
          ref="templateEditorRef"
          v-model="templateCodeModel"
          class="h-full"
        />
      </div>

      <div v-else-if="activeExtension === '.json'" class="absolute inset-0">
        <JsonEditor v-model="jsonDataModel" class="h-full" />
      </div>

      <div v-else-if="activeArtefact" class="absolute inset-0">
        <ArtefactEditorTab
          :artefact="activeArtefact"
          @save="onSaveArtefact"
          @validation-result="onArtefactValidationResult"
        />
      </div>
    </div>

    <p
      v-if="reportStore.renderError"
      class="px-3 py-1.5 text-xs text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ reportStore.renderError }}
    </p>

    <p
      v-if="validationError"
      class="px-3 py-1.5 text-xs text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ validationError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { Button } from "@/components/ui/button";
import TemplateEditor from "./TemplateEditor.vue";
import JsonEditor from "./JsonEditor.vue";
import { useReportStore } from "@/stores/reportStore";
import { useActiveTemplate } from "@/composables/useActiveTemplate";
import { useTemplateDiagnostics } from "@/composables/useTemplateDiagnostics";
import { useWorkspaceTree } from "@/composables/useWorkspaceTree";
import {
  PROJECT_VALIDATION_KEY,
  type UseProjectValidation,
} from "@/composables/useProjectValidation";
import type {
  FileValidationResult,
  TemplateArtefact,
  TemplateFile,
  TemplateFileKind,
} from "@/types/template";
import {
  parseProjectBlock,
  readOutputFormatFromBueloSource,
} from "@/composables/useReportSettings";

const templateCodeModel = defineModel<string>("templateCode", { default: "" });
const jsonDataModel = defineModel<string>("jsonData", { default: "" });

const reportStore = useReportStore();
const {
  activeFile,
  activeFilePath,
  openPaths,
  saveFile,
  setFileContent,
  switchToFile,
  closeFile,
  isDirty,
  markDirty,
} = useActiveTemplate();
const { setValidationResult } = useWorkspaceTree();
const projectValidation = inject<UseProjectValidation | null>(
  PROJECT_VALIDATION_KEY,
  null,
);

const templateEditorRef = ref<InstanceType<typeof TemplateEditor> | null>(null);

const activeExtension = computed(() =>
  extensionOf(activeFile.value?.path ?? ""),
);
const canRenderActive = computed(() => activeExtension.value === ".buelo");

const isProjectValidating = computed(
  () => projectValidation?.isValidating.value ?? false,
);
const projectValidationError = computed(
  () => projectValidation?.error.value ?? null,
);
const projectValidationResult = computed(
  () => projectValidation?.result.value ?? null,
);

const diagnosticState = computed(() => {
  if (isProjectValidating.value) return "validating";
  if (projectValidationError.value) return "error";
  if (!projectValidationResult.value) return "idle";
  if (!projectValidationResult.value.valid) return "error";
  return "ok";
});

watch(
  () => activeFile.value,
  (file) => {
    if (!file) return;
    const ext = extensionOf(file.path);
    if (ext === ".buelo") {
      templateCodeModel.value = file.content;
    }
    if (ext === ".json") {
      jsonDataModel.value = file.content;
    }
  },
  { immediate: true },
);

const debouncedSaveBuelo = useDebounceFn(async () => {
  if (!activeFile.value || extensionOf(activeFile.value.path) !== ".buelo")
    return;
  await saveFile({
    path: activeFile.value.path,
    content: templateCodeModel.value,
  });
}, 600);

const debouncedSaveJson = useDebounceFn(async () => {
  if (!activeFile.value || extensionOf(activeFile.value.path) !== ".json")
    return;
  await saveFile({
    path: activeFile.value.path,
    content: jsonDataModel.value,
    kind: "data",
  });
}, 600);

watch(templateCodeModel, (value) => {
  const path = activeFile.value?.path;
  if (!path || extensionOf(path) !== ".buelo") return;
  setFileContent(path, value);
  markDirty(path, true);
  debouncedSaveBuelo();
});

watch(jsonDataModel, (value) => {
  const path = activeFile.value?.path;
  if (!path || extensionOf(path) !== ".json") return;
  setFileContent(path, value);
  markDirty(path, true);
  debouncedSaveJson();
});

const { validationError } = useTemplateDiagnostics(
  () => templateCodeModel.value,
  () => "BueloDsl",
  () => templateEditorRef.value?.getModel() ?? null,
  () => activeFile.value?.path ?? "",
);

const activeArtefact = computed(() => {
  if (!activeFile.value) return null;
  if (activeExtension.value === ".buelo" || activeExtension.value === ".json")
    return null;
  return toArtefact(activeFile.value);
});

async function runProjectValidation(): Promise<void> {
  if (!projectValidation) return;
  await projectValidation.runValidation();
}

async function onRender(): Promise<void> {
  if (!activeFile.value || !canRenderActive.value) return;

  const source = activeFile.value.content;
  const parsedProject = parseProjectBlock(source);
  const outputFormat = readOutputFormatFromBueloSource(source);

  await reportStore.renderWorkspaceFile({
    templatePath: activeFile.value.path,
    dataSourcePath: parsedProject.dataSourcePath,
    format: outputFormat,
    fileName: fileName(activeFile.value.path).replace(/\.buelo$/i, ""),
  });
}

async function onSaveArtefact(artefact: TemplateArtefact): Promise<void> {
  const path = artefact.path ?? `${artefact.name}${artefact.extension}`;
  await saveFile({
    path,
    content: artefact.content,
    kind: inferFileKind(path),
  });
}

function onArtefactValidationResult(
  fileId: string,
  result: FileValidationResult,
): void {
  setValidationResult(fileId, result);
}

function toArtefact(file: TemplateFile): TemplateArtefact {
  const name = fileName(file.path);
  const dotIndex = name.lastIndexOf(".");
  return {
    path: file.path,
    name: dotIndex >= 0 ? name.slice(0, dotIndex) : name,
    extension: dotIndex >= 0 ? name.slice(dotIndex) : "",
    content: file.content,
  };
}

function inferFileKind(path: string): TemplateFileKind {
  const ext = extensionOf(path);
  if (ext === ".json") return "data";
  if (ext === ".cs" || ext === ".csx") return "helper";
  return "file";
}

function extensionOf(path: string): string {
  const name = fileName(path).toLowerCase();
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index) : "";
}

function fileName(path: string): string {
  return path.split("/").at(-1) ?? path;
}
</script>
