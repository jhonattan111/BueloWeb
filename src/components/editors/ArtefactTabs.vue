<template>
  <div class="flex flex-col h-full min-h-0 bg-muted/30">
    <div
      class="flex items-center gap-2 px-2 h-10 shrink-0 border-b border-border overflow-x-auto"
    >
      <div
        class="text-xs text-muted-foreground truncate max-w-[45ch]"
        :title="activeFilePath"
      >
        {{ activeFilePath || TEMPLATE_FILE_PATH }}
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
        :title="validationError || 'Validation errors'"
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
        :disabled="isValidating"
        class="shrink-0 text-xs px-2 h-6"
        @click="validate"
      >
        Validate
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
        v-show="effectiveActivePath === TEMPLATE_FILE_PATH"
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

    <ValidationSummaryPanel
      :files="summaryFiles"
      :is-open="problemsPanelOpen"
      @toggle="problemsPanelOpen = !problemsPanelOpen"
      @jump-to-diagnostic="onJumpToDiagnostic"
    />

    <VersionHistoryPanel
      v-if="historyOpen && templateStore.activeTemplateId"
      :template-id="templateStore.activeTemplateId"
      @close="historyOpen = false"
      @restore="onRestore"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from "vue";
import { History } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import TemplateEditor from "./TemplateEditor.vue";
import JsonEditor from "./JsonEditor.vue";
import ArtefactEditorTab from "./ArtefactEditorTab.vue";
import VersionHistoryPanel from "./VersionHistoryPanel.vue";
import ValidationSummaryPanel from "./ValidationSummaryPanel.vue";
import type { FileProblemEntry } from "./ValidationSummaryPanel.vue";
import { useReportStore } from "@/stores/reportStore";
import { useTemplateStore } from "@/stores/templateStore";
import { useActiveTemplate } from "@/composables/useActiveTemplate";
import { useTemplateDiagnostics } from "@/composables/useTemplateDiagnostics";
import { useWorkspaceTree } from "@/composables/useWorkspaceTree";
import type {
  Template,
  TemplateArtefact,
  TemplateFile,
  TemplateFileKind,
  TemplateMode,
  FileValidationResult,
  ValidationDiagnostic,
} from "@/types/template";

const TEMPLATE_FILE_PATH = "template.report.cs";
const DATA_FILE_PATH = "data/mock.data.json";

const templateCodeModel = defineModel<string>("templateCode", { default: "" });
const jsonDataModel = defineModel<string>("jsonData", { default: "" });

const reportStore = useReportStore();
const templateStore = useTemplateStore();
const { files, activeFilePath, saveFile, loadFiles } = useActiveTemplate();
const { setValidationResult } = useWorkspaceTree();

const nonCoreFiles = computed(() =>
  files.value.filter(
    (file) => file.path !== TEMPLATE_FILE_PATH && file.path !== DATA_FILE_PATH,
  ),
);

const effectiveActivePath = computed(() => {
  const current = activeFilePath.value || TEMPLATE_FILE_PATH;
  return files.value.some((f) => f.path === current)
    ? current
    : TEMPLATE_FILE_PATH;
});

watch(
  files,
  (nextFiles) => {
    const templateFile = nextFiles.find((f) => f.path === TEMPLATE_FILE_PATH);
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
  const idx = files.value.findIndex((f) => f.path === TEMPLATE_FILE_PATH);
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

const { isValidating, hasErrors, validationError, validate } =
  useTemplateDiagnostics(
    () => templateCodeModel.value,
    () => templateStore.activeTemplate?.mode,
    () => templateEditorRef.value?.getModel() ?? null,
  );

const diagnosticState = computed(() => {
  if (isValidating.value) return "validating";
  if (validationError.value) return "error";
  if (hasErrors.value) return "error";
  return "ok";
});

// ── Problems panel ──────────────────────────────────────────────────────────
const problemsPanelOpen = ref(false);
const artefactValidationResults = reactive<Map<string, FileValidationResult>>(
  new Map(),
);

function onArtefactValidationResult(
  fileId: string,
  result: FileValidationResult,
): void {
  artefactValidationResults.set(fileId, result);
  // Also update the workspace tree's shared validation map
  const templateId = templateStore.activeTemplateId;
  if (templateId) {
    setValidationResult(`${templateId}:${fileId}`, result);
  }
}

// Derive summaryFiles for the panel (artefact results only — template.report.cs uses its own diagnostics)
const summaryFiles = computed<FileProblemEntry[]>(() => {
  const entries: FileProblemEntry[] = [];

  for (const [fileId, result] of artefactValidationResults.entries()) {
    if (result.errors.length || result.warnings.length) {
      const fileName = fileId.split("/").at(-1) ?? fileId;
      entries.push({ fileId, fileName, result });
    }
  }

  return entries;
});

function onJumpToDiagnostic(fileId: string, _diag: ValidationDiagnostic): void {
  // Switch to the file that has the error
  activeFilePath.value = fileId;
}

// ── History / Render ────────────────────────────────────────────────────────
const historyOpen = ref(false);

async function onRestore(template: Template) {
  templateCodeModel.value = template.template;
  historyOpen.value = false;
  await loadFiles();
}

function onRender() {
  const mode = normalizeMode(templateStore.activeTemplate?.mode);
  reportStore.render(templateCodeModel.value, jsonDataModel.value, mode);
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
  if (path.endsWith(".schema.json")) return "schema";
  if (path.endsWith(".data.json")) return "data";
  if (path.endsWith(".cs")) return "template";
  return "file";
}

function normalizeMode(
  mode: TemplateMode | string | number | undefined,
): TemplateMode {
  if (
    mode === "Partial" ||
    mode === 1 ||
    String(mode).toLowerCase() === "partial"
  ) {
    return "Partial";
  }
  return "Sections";
}
</script>
