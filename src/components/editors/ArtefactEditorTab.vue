<template>
  <div class="flex flex-col h-full w-full">
    <div ref="containerRef" class="flex-1 min-h-0" />
    <EditorStatusBar
      :is-validating="isValidating"
      :error-count="errorCount"
      :warning-count="warningCount"
      :extension="props.artefact.extension"
      :language="lang"
      :line-count="lineCount"
      :cursor-line="cursorLine"
      :cursor-column="cursorColumn"
      @go-to-first-error="goToFirstError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useDebounceFn } from "@vueuse/core";
import * as monaco from "monaco-editor";
import { useMonacoEditor } from "@/composables/useMonacoEditor";
import { useFileValidation } from "@/composables/useFileValidation";
import EditorStatusBar from "@/components/editors/EditorStatusBar.vue";
import type { TemplateArtefact, FileValidationResult } from "@/types/template";

const props = defineProps<{ artefact: TemplateArtefact }>();
const emit = defineEmits<{
  save: [artefact: TemplateArtefact];
  validationResult: [fileId: string, result: FileValidationResult];
}>();

const containerRef = ref<HTMLElement | null>(null);
const cursorLine = ref(1);
const cursorColumn = ref(1);
const lineCount = ref(1);

function resolveLanguage(extension: string): string {
  if (extension.endsWith(".cs")) return "csharp";
  if (extension.endsWith(".json")) return "json";
  if (extension.endsWith(".buelo")) return "buelo";
  return "plaintext";
}

const lang = resolveLanguage(props.artefact.extension);

const { getValue, setValue, onDidChangeContent, getModel } = useMonacoEditor(
  containerRef,
  lang,
  props.artefact.content,
);

const debouncedSave = useDebounceFn(() => {
  emit("save", { ...props.artefact, content: getValue() });
}, 1000);

onDidChangeContent(() => {
  lineCount.value = getModel()?.getLineCount() ?? 1;
  debouncedSave();
});

// Track cursor position via Monaco editor events (set up after mount)
watch(containerRef, (el) => {
  if (!el) return;
  // Wait a tick for Monaco to mount, then find the editor instance
  const model = getModel();
  if (!model) return;
  // lineCount initial
  lineCount.value = model.getLineCount();
});

// Update cursor from Monaco model events — only once model is ready
const stopCursorWatch = watch(
  () => getModel(),
  (model) => {
    if (!model) return;
    lineCount.value = model.getLineCount();
    stopCursorWatch();
  },
);

// Content reactive ref for validation
const contentRef = computed(() => {
  // Re-read on content changes via artefact prop
  return props.artefact.content;
});

const { isValidating, result, errorCount, warningCount } = useFileValidation(
  contentRef,
  computed(() => props.artefact.extension),
  computed(() => getModel()),
);

// Propagate results to parent for tree badges
watch(result, (res) => {
  if (res) {
    emit("validationResult", props.artefact.path ?? props.artefact.name, res);
  }
});

watch(
  () => props.artefact.content,
  (val) => setValue(val),
);

function goToFirstError(): void {
  const model = getModel();
  if (!model) return;
  const markers = monaco.editor.getModelMarkers({ resource: model.uri });
  if (!markers.length) return;
  const first = markers[0];
  // Find all editors and scroll to the marker
  const editors = monaco.editor.getEditors();
  for (const ed of editors) {
    if (ed.getModel()?.uri.toString() === model.uri.toString()) {
      ed.revealLineInCenter(first.startLineNumber);
      ed.setPosition({
        lineNumber: first.startLineNumber,
        column: first.startColumn,
      });
      ed.focus();
      break;
    }
  }
}

defineExpose({ getModel });
</script>
