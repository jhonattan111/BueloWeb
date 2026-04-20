<script setup lang="ts">
import { computed } from "vue";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-vue-next";

const props = defineProps<{
  isValidating: boolean;
  errorCount: number;
  warningCount: number;
  extension: string;
  language: string;
  lineCount: number;
  cursorLine: number;
  cursorColumn: number;
}>();

const emit = defineEmits<{
  (e: "goToFirstError"): void;
}>();

const statusLabel = computed(() => {
  if (props.isValidating) return "Validating…";
  if (props.errorCount > 0) {
    const w =
      props.warningCount > 0
        ? `, ${props.warningCount} warning${props.warningCount !== 1 ? "s" : ""}`
        : "";
    return `${props.errorCount} error${props.errorCount !== 1 ? "s" : ""}${w}`;
  }
  if (props.warningCount > 0) {
    return `${props.warningCount} warning${props.warningCount !== 1 ? "s" : ""}`;
  }
  return "No problems";
});

const statusColor = computed(() => {
  if (props.isValidating) return "text-muted-foreground";
  if (props.errorCount > 0) return "text-destructive";
  if (props.warningCount > 0) return "text-yellow-500";
  return "text-green-500";
});

function handleStatusClick() {
  if (props.errorCount > 0 || props.warningCount > 0) {
    emit("goToFirstError");
  }
}
</script>

<template>
  <div
    class="flex items-center justify-between h-6 px-2 text-xs bg-muted/60 border-t border-border select-none"
  >
    <!-- Left: validation status -->
    <button
      type="button"
      :class="[
        'flex items-center gap-1',
        statusColor,
        errorCount > 0 || warningCount > 0
          ? 'cursor-pointer hover:underline'
          : 'cursor-default',
      ]"
      @click="handleStatusClick"
    >
      <Loader2 v-if="isValidating" class="h-3 w-3 animate-spin" />
      <AlertCircle v-else-if="errorCount > 0" class="h-3 w-3" />
      <AlertTriangle v-else-if="warningCount > 0" class="h-3 w-3" />
      <CheckCircle v-else class="h-3 w-3" />
      <span>{{ statusLabel }}</span>
    </button>

    <!-- Right: language + cursor position -->
    <div class="flex items-center gap-3 text-muted-foreground">
      <span class="uppercase tracking-wide">{{
        language || extension.replace(".", "")
      }}</span>
      <span>Ln {{ cursorLine }}, Col {{ cursorColumn }}</span>
    </div>
  </div>
</template>
