<template>
  <div class="relative flex flex-col h-full min-h-0 bg-muted/20">
    <!-- Header -->
    <div class="flex items-center px-3 h-10 shrink-0 border-b border-border">
      <span
        class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >Preview</span
      >
    </div>

    <!-- Body -->
    <div class="relative flex-1 min-h-0 overflow-hidden">
      <!-- Empty state -->
      <div
        v-if="!store.pdfBlob && !store.isRendering && !store.renderError"
        class="absolute inset-0 flex items-center justify-center"
      >
        <p class="text-sm text-muted-foreground text-center px-4">
          Render a template to see the preview here.
        </p>
      </div>

      <!-- Loading state -->
      <div
        v-else-if="store.isRendering"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-2">
          <div
            class="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin"
          />
          <p class="text-xs text-muted-foreground">Rendering…</p>
        </div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="store.renderError && !store.pdfBlob"
        class="absolute inset-0 flex items-center justify-center p-4"
      >
        <Alert variant="destructive" class="max-w-xs">
          <AlertTitle>Render failed</AlertTitle>
          <AlertDescription>{{ store.renderError }}</AlertDescription>
        </Alert>
      </div>

      <!-- PDF iframe -->
      <iframe
        v-if="objectUrl"
        :src="objectUrl"
        class="absolute inset-0 w-full h-full border-0"
        title="PDF Preview"
      />
    </div>

    <!-- Download button -->
    <a
      v-if="objectUrl"
      :href="objectUrl"
      download="report.pdf"
      class="absolute top-2 right-2"
    >
      <Button variant="outline" size="sm">
        <Download class="size-3.5 mr-1" />
        Download
      </Button>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { Download } from "lucide-vue-next";
import { useReportStore } from "@/stores/reportStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const store = useReportStore();
const objectUrl = ref<string | null>(null);

watch(
  () => store.pdfBlob,
  (blob) => {
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value);
      objectUrl.value = null;
    }
    if (blob) {
      objectUrl.value = URL.createObjectURL(blob);
    }
  },
);

onUnmounted(() => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
  }
});
</script>
