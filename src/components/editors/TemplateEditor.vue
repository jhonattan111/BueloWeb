<template>
  <div ref="containerRef" class="h-full w-full" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useMonacoEditor } from "@/composables/useMonacoEditor";

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const containerRef = ref<HTMLElement | null>(null);
const { getValue, setValue, onDidChangeContent, getModel } = useMonacoEditor(
  containerRef,
  "csharp",
  props.modelValue || "",
);

onDidChangeContent(() => {
  emit("update:modelValue", getValue());
});

onMounted(() => {
  emit("update:modelValue", getValue());
});

watch(
  () => props.modelValue,
  (val) => setValue(val),
);

defineExpose({ getModel });
</script>
