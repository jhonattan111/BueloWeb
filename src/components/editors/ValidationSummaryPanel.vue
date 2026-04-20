<script setup lang="ts">
import { computed } from "vue";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-vue-next";
import type {
  FileValidationResult,
  ValidationDiagnostic,
} from "@/types/template";

export interface FileProblemEntry {
  /** Node id / file path key (for jumping to file) */
  fileId: string;
  fileName: string;
  result: FileValidationResult;
}

const props = defineProps<{
  files: FileProblemEntry[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle"): void;
  (e: "jumpToDiagnostic", fileId: string, diag: ValidationDiagnostic): void;
}>();

const totalErrors = computed(() =>
  props.files.reduce((sum, f) => sum + f.result.errors.length, 0),
);
const totalWarnings = computed(() =>
  props.files.reduce((sum, f) => sum + f.result.warnings.length, 0),
);

const badgeLabel = computed(() => {
  const parts: string[] = [];
  if (totalErrors.value)
    parts.push(
      `${totalErrors.value} error${totalErrors.value !== 1 ? "s" : ""}`,
    );
  if (totalWarnings.value)
    parts.push(
      `${totalWarnings.value} warning${totalWarnings.value !== 1 ? "s" : ""}`,
    );
  return parts.length ? `Problems (${parts.join(", ")})` : "Problems";
});

function handleToggle() {
  emit("toggle");
}

function handleJump(fileId: string, diag: ValidationDiagnostic) {
  emit("jumpToDiagnostic", fileId, diag);
}
</script>

<template>
  <div class="border-t border-border bg-background text-xs">
    <!-- Panel header / toggle bar -->
    <button
      type="button"
      class="flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
      @click="handleToggle"
    >
      <div class="flex items-center gap-2">
        <span>{{ badgeLabel }}</span>
        <span
          v-if="totalErrors > 0"
          class="flex items-center gap-0.5 text-destructive"
        >
          <AlertCircle class="h-3 w-3" />
          {{ totalErrors }}
        </span>
        <span
          v-if="totalWarnings > 0"
          class="flex items-center gap-0.5 text-yellow-500"
        >
          <AlertTriangle class="h-3 w-3" />
          {{ totalWarnings }}
        </span>
      </div>
      <ChevronDown v-if="!isOpen" class="h-3.5 w-3.5" />
      <ChevronUp v-else class="h-3.5 w-3.5" />
    </button>

    <!-- Problem list -->
    <div v-if="isOpen" class="max-h-40 overflow-y-auto">
      <template v-for="entry in files" :key="entry.fileId">
        <template
          v-if="entry.result.errors.length || entry.result.warnings.length"
        >
          <!-- File header -->
          <div
            class="px-3 py-1 font-semibold text-foreground bg-muted/30 border-b border-border/50"
          >
            {{ entry.fileName }}
          </div>
          <!-- Diagnostics -->
          <button
            v-for="(diag, idx) in [
              ...entry.result.errors,
              ...entry.result.warnings,
            ]"
            :key="idx"
            type="button"
            class="flex w-full items-start gap-2 px-4 py-1 hover:bg-muted/40 text-left transition-colors"
            @click="handleJump(entry.fileId, diag)"
          >
            <AlertCircle
              v-if="diag.severity === 'error'"
              class="mt-0.5 h-3 w-3 shrink-0 text-destructive"
            />
            <AlertTriangle
              v-else
              class="mt-0.5 h-3 w-3 shrink-0 text-yellow-500"
            />
            <span class="text-foreground flex-1 break-words">{{
              diag.message
            }}</span>
            <span class="shrink-0 text-muted-foreground"
              >Ln {{ diag.line }}, Col {{ diag.column }}</span
            >
          </button>
        </template>
      </template>

      <div
        v-if="
          files.every(
            (f) => !f.result.errors.length && !f.result.warnings.length,
          )
        "
        class="px-3 py-2 text-muted-foreground italic"
      >
        No problems detected
      </div>
    </div>
  </div>
</template>
