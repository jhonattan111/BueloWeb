<template>
  <div class="flex flex-col h-full min-h-0 bg-muted/30">
    <!-- Status bar -->
    <div
      class="flex items-center gap-1 px-2 h-10 shrink-0 border-b border-border overflow-x-auto"
    >
      <!-- Spacer + diagnostic icon + toolbar buttons + Render -->
      <div class="flex-1 min-w-2" />

      <!-- Diagnostic status icon -->
      <span
        v-if="diagnosticState === 'validating'"
        class="text-muted-foreground text-xs animate-spin inline-block"
        title="Validating…"
        >⟳</span
      >
      <span
        v-else-if="diagnosticState === 'error'"
        class="text-destructive text-xs"
        title="Validation errors"
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
        >–</span
      >

      <!-- Validate button -->
      <Button
        size="sm"
        variant="ghost"
        :disabled="isValidating"
        class="shrink-0 text-xs px-2 h-6"
        @click="validate"
      >
        Validate
      </Button>

      <!-- History button -->
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
        <span v-if="reportStore.isRendering">Rendering…</span>
        <span v-else>Render</span>
      </Button>
    </div>

    <!-- Content split: directory tree + editor -->
    <div class="flex-1 min-h-0 flex">
      <aside
        class="w-72 max-w-[45%] min-w-56 border-r border-border bg-background/70"
      >
        <div
          class="h-9 px-2 flex items-center justify-between border-b border-border"
        >
          <span
            class="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
            >Files</span
          >
          <button
            class="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Add file"
            @click="addDialogOpen = true"
          >
            <Plus class="size-3.5" />
          </button>
        </div>

        <div class="h-[calc(100%-2.25rem)] overflow-auto p-2 space-y-2">
          <div
            v-for="group in fileGroups"
            :key="group.directory"
            class="space-y-1"
          >
            <p
              class="px-1 text-[10px] uppercase tracking-wider text-muted-foreground truncate"
            >
              {{ group.label }}
            </p>

            <div
              v-for="file in group.files"
              :key="file.path"
              class="group flex items-center gap-1"
            >
              <button
                :class="treeFileClass(file.path)"
                :title="file.path"
                @click="activeTab = file.path"
              >
                {{ fileName(file.path) }}
              </button>

              <button
                v-if="canDeleteFile(file.path)"
                class="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                :aria-label="`Delete ${file.path}`"
                @click.stop="confirmDelete(file.path)"
              >
                <X class="size-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex-1 min-h-0 relative">
        <!-- Template editor -->
        <div v-show="activeTab === TEMPLATE_FILE_PATH" class="absolute inset-0">
          <TemplateEditor
            ref="templateEditorRef"
            v-model="templateCodeModel"
            class="h-full"
          />
        </div>

        <!-- Data editor -->
        <div v-show="activeTab === DATA_FILE_PATH" class="absolute inset-0">
          <JsonEditor v-model="jsonDataModel" class="h-full" />
        </div>

        <!-- File editors (all mounted, shown/hidden via v-show) -->
        <div
          v-for="file in nonCoreFiles"
          :key="file.path"
          v-show="activeTab === file.path"
          class="absolute inset-0"
        >
          <ArtefactEditorTab
            :artefact="toArtefact(file)"
            @save="onSaveArtefact"
          />
        </div>
      </div>
    </div>

    <!-- Inline render error -->
    <p
      v-if="reportStore.renderError"
      class="px-3 py-1.5 text-xs text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ reportStore.renderError }}
    </p>

    <!-- Add file dialog -->
    <AddArtefactDialog v-model:open="addDialogOpen" @add="onAddFile" />

    <!-- Delete file confirmation -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete File</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{{ deletingFilePath }}"? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="executeDelete">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Version history panel (overlay) -->
    <VersionHistoryPanel
      v-if="historyOpen && templateStore.activeTemplateId"
      :template-id="templateStore.activeTemplateId"
      @close="historyOpen = false"
      @restore="onRestore"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { History, Plus, X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
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
import TemplateEditor from "./TemplateEditor.vue";
import JsonEditor from "./JsonEditor.vue";
import ArtefactEditorTab from "./ArtefactEditorTab.vue";
import AddArtefactDialog from "./AddArtefactDialog.vue";
import VersionHistoryPanel from "./VersionHistoryPanel.vue";
import { useReportStore } from "@/stores/reportStore";
import { useTemplateStore } from "@/stores/templateStore";
import { useActiveTemplate } from "@/composables/useActiveTemplate";
import { useTemplateDiagnostics } from "@/composables/useTemplateDiagnostics";
import type {
  Template,
  TemplateArtefact,
  TemplateFile,
  TemplateFileKind,
  TemplateMode,
} from "@/types/template";

const templateCodeModel = defineModel<string>("templateCode", { default: "" });
const jsonDataModel = defineModel<string>("jsonData", { default: "" });

const TEMPLATE_FILE_PATH = "template.report.cs";
const DATA_FILE_PATH = "data/mock.data.json";

const reportStore = useReportStore();
const templateStore = useTemplateStore();
const { files, saveFile, removeFile, loadFiles } = useActiveTemplate();

const activeTab = ref<string>(TEMPLATE_FILE_PATH);

const nonCoreFiles = computed(() =>
  files.value.filter(
    (file) => file.path !== TEMPLATE_FILE_PATH && file.path !== DATA_FILE_PATH,
  ),
);

function treeFileClass(path: string) {
  const active = activeTab.value === path;
  return [
    "flex-1 min-w-0 text-left px-2 py-1 text-xs rounded border transition-colors truncate",
    active
      ? "bg-accent text-accent-foreground border-border"
      : "text-foreground/90 border-transparent hover:bg-muted",
  ];
}

function onRender() {
  reportStore.render(templateCodeModel.value, jsonDataModel.value);
}

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

    if (!nextFiles.some((f) => f.path === activeTab.value)) {
      activeTab.value = TEMPLATE_FILE_PATH;
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

// ── Diagnostics ───────────────────────────────────────────────────────────────
const templateEditorRef = ref<InstanceType<typeof TemplateEditor> | null>(null);

const { isValidating, hasErrors, validate } = useTemplateDiagnostics(
  () => templateCodeModel.value,
  () => (templateStore.activeTemplate?.mode as TemplateMode) ?? "Sections",
  () => templateEditorRef.value?.getModel() ?? null,
);

const diagnosticState = computed(() => {
  if (isValidating.value) return "validating";
  if (hasErrors.value) return "error";
  if (!isValidating.value && !hasErrors.value) return "ok";
  return "idle";
});

// ── History panel ─────────────────────────────────────────────────────────────
const historyOpen = ref(false);

async function onRestore(template: Template) {
  templateCodeModel.value = template.template;
  historyOpen.value = false;
  await loadFiles();
}

// ── File add ───────────────────────────────────────────────────────────────
const addDialogOpen = ref(false);

async function onAddFile(payload: {
  path: string;
  content: string;
  kind: TemplateFileKind;
  mode?: TemplateMode;
}) {
  if (
    payload.kind === "template-sections" ||
    payload.kind === "template-partial"
  ) {
    const content = templateCodeModel.value.trim()
      ? templateCodeModel.value
      : payload.content;

    await saveFile({
      path: TEMPLATE_FILE_PATH,
      content,
      kind: "template",
      ...(payload.mode ? { mode: payload.mode } : {}),
    });
    templateCodeModel.value = content;
    activeTab.value = TEMPLATE_FILE_PATH;
    return;
  }

  await saveFile({
    path: payload.path,
    content: payload.content,
    kind: payload.kind,
    ...(payload.mode ? { mode: payload.mode } : {}),
  });

  if (payload.path === DATA_FILE_PATH) {
    jsonDataModel.value = payload.content;
  }

  activeTab.value = payload.path;
}

// ── File save (debounced via ArtefactEditorTab) ───────────────────────────
async function onSaveArtefact(artefact: TemplateArtefact) {
  await saveFile({
    path: artefact.path ?? `${artefact.name}${artefact.extension}`,
    content: artefact.content,
    kind: inferFileKind(
      artefact.path ?? `${artefact.name}${artefact.extension}`,
    ),
  });
}

// ── File delete ───────────────────────────────────────────────────────────
const deleteDialogOpen = ref(false);
const deletingFilePath = ref<string>("");

function confirmDelete(path: string) {
  deletingFilePath.value = path;
  deleteDialogOpen.value = true;
}

async function executeDelete() {
  const path = deletingFilePath.value;
  await removeFile(path);
  if (activeTab.value === path) {
    activeTab.value = TEMPLATE_FILE_PATH;
  }
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

function canDeleteFile(path: string): boolean {
  return path !== TEMPLATE_FILE_PATH && path !== DATA_FILE_PATH;
}

const fileGroups = computed(() => {
  const byDir = new Map<string, TemplateFile[]>();

  for (const file of files.value) {
    const directory = file.path.includes("/")
      ? file.path.slice(0, file.path.lastIndexOf("/"))
      : ".";

    if (!byDir.has(directory)) {
      byDir.set(directory, []);
    }

    byDir.get(directory)!.push(file);
  }

  return Array.from(byDir.entries())
    .map(([directory, groupedFiles]) => ({
      directory,
      label: directory === "." ? "root" : directory,
      files: [...groupedFiles].sort((a, b) =>
        fileName(a.path).localeCompare(fileName(b.path)),
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

function fileName(path: string): string {
  return path.split("/").at(-1) ?? path;
}

function inferFileKind(path: string): TemplateFileKind {
  if (path.endsWith(".helpers.cs")) return "helper";
  if (path.endsWith(".schema.json")) return "schema";
  if (path.endsWith(".data.json")) return "data";
  if (path.endsWith(".cs")) return "template";
  return "file";
}
</script>
