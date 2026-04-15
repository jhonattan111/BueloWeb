<template>
  <div ref="containerRef" class="h-full w-full" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useMonacoEditor } from "@/composables/useMonacoEditor";
import type { TemplateArtefact } from "@/types/template";

const props = defineProps<{ artefact: TemplateArtefact }>();
const emit = defineEmits<{ save: [artefact: TemplateArtefact] }>();

const containerRef = ref<HTMLElement | null>(null);

function resolveLanguage(extension: string): string {
  if (extension.endsWith(".cs")) return "csharp";
  if (extension.endsWith(".json")) return "json";
  return "plaintext";
}

const lang = resolveLanguage(props.artefact.extension);

const { getValue, setValue, onDidChangeContent } = useMonacoEditor(
  containerRef,
  lang,
  props.artefact.content,
);

const debouncedSave = useDebounceFn(() => {
  emit("save", { ...props.artefact, content: getValue() });
}, 1000);

onDidChangeContent(debouncedSave);

watch(
  () => props.artefact.content,
  (val) => setValue(val),
);
</script>
