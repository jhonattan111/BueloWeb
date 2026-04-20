<script setup lang="ts">
import type { OutputFormat } from "@/services/reportService";

const props = defineProps<{
  modelValue: string;
  formats: OutputFormat[];
  /** Current template mode — Excel requires BueloDsl */
  templateMode?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", format: string): void;
}>();

function isDisabled(format: OutputFormat): boolean {
  if (format.format === "pdf") return false;
  // Excel (non-PDF) requires BueloDsl mode
  const mode = props.templateMode;
  if (!mode) return false;
  return mode !== "BueloDsl" && mode !== "Sections";
}

function disabledTitle(format: OutputFormat): string {
  if (isDisabled(format)) return "Excel requires .buelo DSL mode";
  return "";
}

function select(format: OutputFormat): void {
  if (isDisabled(format)) return;
  emit("update:modelValue", format.format);
}
</script>

<template>
  <div
    class="flex items-center gap-1 p-1 bg-muted/50 rounded-md border border-border"
  >
    <button
      v-for="fmt in formats"
      :key="fmt.format"
      type="button"
      :disabled="isDisabled(fmt)"
      :title="disabledTitle(fmt)"
      class="px-3 py-1 text-xs font-medium rounded transition-colors"
      :class="[
        modelValue === fmt.format
          ? 'bg-background text-foreground shadow-sm border border-border'
          : 'text-muted-foreground hover:text-foreground',
        isDisabled(fmt) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ]"
      @click="select(fmt)"
    >
      {{ fmt.format.toUpperCase() }}
    </button>
  </div>
</template>
