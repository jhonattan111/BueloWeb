<template>
  <div ref="containerRef" class="h-full w-full" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useMonacoEditor } from "@/composables/useMonacoEditor";

const DEFAULT_TEMPLATE = `Hello, {{ name }}!
Today is {{ date }}.
`;

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const containerRef = ref<HTMLElement | null>(null);
const { getValue, setValue, onDidChangeContent, getModel } = useMonacoEditor(
  containerRef,
  "buelo",
  props.modelValue || DEFAULT_TEMPLATE,
);

onDidChangeContent(() => {
  emit("update:modelValue", getValue());
});

onMounted(() => {
  if (!props.modelValue) {
    emit("update:modelValue", getValue());
  }
});

watch(
  () => props.modelValue,
  (val) => setValue(val),
);

defineExpose({ getModel });
</script>
