<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  class?: HTMLAttributes["class"];
  modelValue?: string | number;
}>();

const emits = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <input
    v-bind="$attrs"
    :value="modelValue"
    :class="
      cn(
        'flex h-8 w-full rounded-none border border-input bg-background px-3 py-1 text-xs shadow-none transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
    @input="
      emits('update:modelValue', ($event.target as HTMLInputElement).value)
    "
  />
</template>
