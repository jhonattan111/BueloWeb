<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import { Input } from "@/components/ui/input";

const props = defineProps<{
  format: string;
  modelValue: Record<string, string>;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", hints: Record<string, string>): void;
  (e: "toggle"): void;
}>();

const isExcel = computed(() => props.format === "excel");

const sheetName = computed({
  get: () => props.modelValue["excel.sheetName"] ?? "",
  set: (val) => updateHint("excel.sheetName", val),
});

const freezeHeader = computed({
  get: () => props.modelValue["excel.freezeHeader"] === "true",
  set: (val) => updateHint("excel.freezeHeader", val ? "true" : "false"),
});

function updateHint(key: string, value: string): void {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}

function handleToggle(): void {
  emit("toggle");
}

function handleSheetNameInput(event: Event): void {
  sheetName.value = (event.target as HTMLInputElement).value;
}

function handleFreezeHeaderChange(event: Event): void {
  freezeHeader.value = (event.target as HTMLInputElement).checked;
}
</script>

<template>
  <div v-if="isExcel" class="border-t border-border text-xs">
    <!-- Toggle header -->
    <button
      type="button"
      class="flex w-full items-center justify-between px-3 py-1.5 text-muted-foreground hover:bg-muted/40 transition-colors"
      @click="handleToggle"
    >
      <span class="font-medium">Format options</span>
      <ChevronDown v-if="!isOpen" class="h-3.5 w-3.5" />
      <ChevronUp v-else class="h-3.5 w-3.5" />
    </button>

    <!-- Options -->
    <div v-if="isOpen" class="px-3 pb-3 pt-1 flex flex-col gap-3">
      <!-- Sheet name -->
      <div class="flex flex-col gap-1">
        <label class="text-muted-foreground font-medium">Sheet name</label>
        <Input
          :value="sheetName"
          placeholder="Sheet1"
          class="h-7 text-xs"
          @input="handleSheetNameInput"
        />
      </div>

      <!-- Freeze header row -->
      <div class="flex items-center gap-2">
        <input
          id="freeze-header"
          type="checkbox"
          :checked="freezeHeader"
          class="h-3.5 w-3.5 rounded border-border"
          @change="handleFreezeHeaderChange"
        />
        <label
          for="freeze-header"
          class="text-muted-foreground cursor-pointer select-none"
        >
          Freeze header row
        </label>
      </div>
    </div>
  </div>
</template>
