<template>
  <div class="flex flex-col h-full min-h-0 bg-muted/30">
    <!-- Tab bar -->
    <div
      class="flex items-center gap-1 px-2 h-10 shrink-0 border-b border-border overflow-x-auto"
    >
      <!-- Template tab -->
      <button
        :class="tabClass('__template__')"
        @click="activeTab = '__template__'"
      >
        Template
      </button>

      <!-- Data tab (only when no .data.json artefact) -->
      <button
        v-if="!hasDataArtefact"
        :class="tabClass('__data__')"
        @click="activeTab = '__data__'"
      >
        Data (JSON)
      </button>

      <!-- Dynamic artefact tabs -->
      <div
        v-for="artefact in artefacts"
        :key="artefact.name"
        class="flex items-center gap-0.5 shrink-0"
      >
        <button
          :class="tabClass(artefact.name)"
          @click="activeTab = artefact.name"
        >
          {{ artefact.name }}{{ artefact.extension }}
        </button>
        <button
          class="flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          :aria-label="`Delete ${artefact.name}${artefact.extension}`"
          @click.stop="confirmDelete(artefact.name)"
        >
          <X class="size-3" />
        </button>
      </div>

      <!-- Add artefact button -->
      <button
        class="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        aria-label="Add artefact"
        @click="addDialogOpen = true"
      >
        <Plus class="size-3.5" />
      </button>

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

    <!-- Tab content -->
    <div class="flex-1 min-h-0 relative">
      <!-- Template editor -->
      <div v-show="activeTab === '__template__'" class="absolute inset-0">
        <TemplateEditor
          ref="templateEditorRef"
          v-model="templateCodeModel"
          class="h-full"
        />
      </div>

      <!-- Data editor -->
      <div
        v-show="activeTab === '__data__' && !hasDataArtefact"
        class="absolute inset-0"
      >
        <JsonEditor v-model="jsonDataModel" class="h-full" />
      </div>

      <!-- Artefact editors (all mounted, shown/hidden via v-show) -->
      <div
        v-for="artefact in artefacts"
        :key="artefact.name"
        v-show="activeTab === artefact.name"
        class="absolute inset-0"
      >
        <ArtefactEditorTab :artefact="artefact" @save="onSaveArtefact" />
      </div>
    </div>

    <!-- Inline render error -->
    <p
      v-if="reportStore.renderError"
      class="px-3 py-1.5 text-xs text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ reportStore.renderError }}
    </p>

    <!-- Add artefact dialog -->
    <AddArtefactDialog v-model:open="addDialogOpen" @add="onAddArtefact" />

    <!-- Delete artefact confirmation -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Artefact</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{{ deletingArtefactName }}"? This
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
import { computed, ref } from "vue";
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
  TemplateMode,
} from "@/types/template";

const templateCodeModel = defineModel<string>("templateCode", { default: "" });
const jsonDataModel = defineModel<string>("jsonData", { default: "" });

const reportStore = useReportStore();
const templateStore = useTemplateStore();
const { artefacts, saveArtefact, removeArtefact, loadArtefacts } =
  useActiveTemplate();

const activeTab = ref<string>("__template__");

const hasDataArtefact = computed(() =>
  artefacts.value.some((a) => a.extension === ".data.json"),
);

function tabClass(tabId: string) {
  const active = activeTab.value === tabId;
  return [
    "px-2 h-6 text-xs rounded transition-colors shrink-0 whitespace-nowrap",
    active
      ? "bg-background text-foreground shadow-sm border border-border"
      : "text-muted-foreground hover:text-foreground hover:bg-muted",
  ];
}

function onRender() {
  reportStore.render(templateCodeModel.value, jsonDataModel.value);
}

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
  await loadArtefacts();
}

// ── Artefact add ─────────────────────────────────────────────────────────────
const addDialogOpen = ref(false);

async function onAddArtefact(artefact: TemplateArtefact) {
  await saveArtefact(artefact);
  activeTab.value = artefact.name;
}

// ── Artefact save (debounced via ArtefactEditorTab) ───────────────────────────
async function onSaveArtefact(artefact: TemplateArtefact) {
  await saveArtefact(artefact);
}

// ── Artefact delete ───────────────────────────────────────────────────────────
const deleteDialogOpen = ref(false);
const deletingArtefactName = ref<string>("");

function confirmDelete(name: string) {
  deletingArtefactName.value = name;
  deleteDialogOpen.value = true;
}

async function executeDelete() {
  const name = deletingArtefactName.value;
  await removeArtefact(name);
  if (activeTab.value === name) {
    activeTab.value = "__template__";
  }
}
</script>
