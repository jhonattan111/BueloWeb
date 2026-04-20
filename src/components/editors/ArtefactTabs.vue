<template>
  <div class="flex flex-col h-full min-h-0 bg-muted/30">
    <div
      class="flex items-center gap-2 px-2 h-10 shrink-0 border-b border-border overflow-x-auto"
    >
      <div
        class="text-xs text-muted-foreground truncate max-w-[45ch]"
        :title="activeFilePath"
      >
        {{ activeFilePath || templatePath }}
      </div>

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
        variant="ghost"
        class="shrink-0 text-xs px-2 h-6"
        @click="historyOpen = !historyOpen"
      >
        <History class="size-3.5 mr-1" />History
      </Button>

      <Button
        size="sm"
        :disabled="reportStore.isRendering"
        class="shrink-0"
        @click="onRender"
      >
        <span v-if="reportStore.isRendering">Rendering...</span>
        <span v-else>Render</span>
      </Button>
    </div>

    <div class="flex-1 min-h-0 relative">
      <div
        v-show="effectiveActivePath === templatePath"
        class="absolute inset-0"
      >
        <TemplateEditor
          ref="templateEditorRef"
          v-model="templateCodeModel"
          class="h-full"
        />
      </div>

      <div
        v-show="effectiveActivePath === DATA_FILE_PATH"
        class="absolute inset-0"
      >
        <JsonEditor v-model="jsonDataModel" class="h-full" />
      </div>

      <div
        v-for="file in nonCoreFiles"
        :key="file.path"
        v-show="effectiveActivePath === file.path"
        class="absolute inset-0"
      >
        <ArtefactEditorTab
          :artefact="toArtefact(file)"
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

    <VersionHistoryPanel
      v-if="historyOpen && templateStore.activeTemplateId"
      :template-id="templateStore.activeTemplateId"
      @close="historyOpen = false"
      @restore="onRestore"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { History } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import TemplateEditor from "./TemplateEditor.vue";
import JsonEditor from "./JsonEditor.vue";
import ArtefactEditorTab from "./ArtefactEditorTab.vue";
import VersionHistoryPanel from "./VersionHistoryPanel.vue";
import { useReportStore } from "@/stores/reportStore";
import { useTemplateStore } from "@/stores/templateStore";
import { useActiveTemplate } from "@/composables/useActiveTemplate";
import { useTemplateDiagnostics } from "@/composables/useTemplateDiagnostics";
import { useWorkspaceTree } from "@/composables/useWorkspaceTree";
import {
  PROJECT_VALIDATION_KEY,
  type UseProjectValidation,
} from "@/composables/useProjectValidation";
import type {
  Template,
  TemplateArtefact,
  TemplateFile,
  TemplateFileKind,
  FileValidationResult,
} from "@/types/template";

const DATA_FILE_PATH = "data/mock.data.json";

const templateCodeModel = defineModel<string>("templateCode", { default: "" });
const jsonDataModel = defineModel<string>("jsonData", { default: "" });

const reportStore = useReportStore();
const templateStore = useTemplateStore();
const { files, activeFilePath, saveFile, loadFiles } = useActiveTemplate();
const { setValidationResult } = useWorkspaceTree();
const projectValidation = inject<UseProjectValidation | null>(
  PROJECT_VALIDATION_KEY,
  null,
);

const templatePath = computed(() => {
  const name = templateStore.activeTemplate?.name ?? "template";
  return name.endsWith(".buelo") ? name : `${name}.buelo`;
});

const nonCoreFiles = computed(() =>
  files.value.filter(
    (file) => file.path !== templatePath.value && file.path !== DATA_FILE_PATH,
  ),
);

const effectiveActivePath = computed(() => {
  const current = activeFilePath.value || templatePath.value;
  return files.value.some((f) => f.path === current)
    ? current
    : templatePath.value;
});

watch(
  files,
  (nextFiles) => {
    const templateFile = nextFiles.find((f) => f.path === templatePath.value);
    if (templateFile && templateCodeModel.value !== templateFile.content) {
      templateCodeModel.value = templateFile.content;
    }

    const dataFile = nextFiles.find((f) => f.path === DATA_FILE_PATH);
    if (dataFile && jsonDataModel.value !== dataFile.content) {
      jsonDataModel.value = dataFile.content;
    }
  },
  { immediate: true, deep: true },
);

watch(templateCodeModel, (value) => {
  const idx = files.value.findIndex((f) => f.path === templatePath.value);
  if (idx !== -1) {
    files.value[idx] = { ...files.value[idx], content: value };
  }
});

watch(jsonDataModel, (value) => {
  const idx = files.value.findIndex((f) => f.path === DATA_FILE_PATH);
  if (idx !== -1) {
    files.value[idx] = { ...files.value[idx], content: value };
  }
});

const templateEditorRef = ref<InstanceType<typeof TemplateEditor> | null>(null);

const { validationError } = useTemplateDiagnostics(
  () => templateCodeModel.value,
  () => "BueloDsl",
  () => templateEditorRef.value?.getModel() ?? null,
);

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

function onArtefactValidationResult(
  fileId: string,
  result: FileValidationResult,
): void {
  // Also update the workspace tree's shared validation map
  const templateId = templateStore.activeTemplateId;
  if (templateId) {
    setValidationResult(`${templateId}:${fileId}`, result);
  }
}

// ── History / Render ────────────────────────────────────────────────────────
const historyOpen = ref(false);

async function runProjectValidation(): Promise<void> {
  if (!projectValidation) return;
  await projectValidation.runValidation();
}

async function onRestore(template: Template) {
  templateCodeModel.value = template.template;
  historyOpen.value = false;
  await loadFiles();
}

function onRender() {
  reportStore.render(templateCodeModel.value, jsonDataModel.value, "BueloDsl");
}

async function onSaveArtefact(artefact: TemplateArtefact) {
  await saveFile({
    path: artefact.path ?? `${artefact.name}${artefact.extension}`,
    content: artefact.content,
    kind: inferFileKind(
      artefact.path ?? `${artefact.name}${artefact.extension}`,
    ),
  });
}

function toArtefact(file: TemplateFile): TemplateArtefact {
  const fileName = file.path.split("/").at(-1) ?? file.path;
  const dotIndex = fileName.indexOf(".");
  const name = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex) : "";

  return {
    path: file.path,
    name,
    extension,
    content: file.content,
  };
}

function inferFileKind(path: string): TemplateFileKind {
  if (path.endsWith(".helpers.cs")) return "helper";
  if (path.endsWith(".data.json")) return "data";
  return "file";
}
</script>
