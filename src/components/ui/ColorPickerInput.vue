<script setup lang="ts">
import { computed } from "vue";
import { Input } from "@/components/ui/input";

const props = defineProps<{
  modelValue: string;
  label: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isValid = computed(() => /^#[0-9A-Fa-f]{6}$/.test(props.modelValue));

function onColorInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLInputElement).value);
}

function onTextInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="text-xs text-muted-foreground">{{ label }}</label>
    <div class="flex items-center gap-2">
      <input
        type="color"
        :value="modelValue"
        class="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
        @input="onColorInput"
      />
      <Input
        :value="modelValue"
        class="h-8 font-mono text-xs"
        :class="!isValid ? 'border-destructive ring-1 ring-destructive' : ''"
        placeholder="#RRGGBB"
        maxlength="7"
        @input="onTextInput"
      />
    </div>
    <p v-if="!isValid" class="text-xs text-destructive">
      Must be a valid hex color (e.g. #FF0000)
    </p>
  </div>
</template>
