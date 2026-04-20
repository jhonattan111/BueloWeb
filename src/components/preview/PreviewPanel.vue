<template>
  <div class="relative flex flex-col h-full min-h-0 bg-muted/20">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-3 h-10 shrink-0 border-b border-border"
    >
      <span
        class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >Preview</span
      >
      <span class="text-[11px] text-muted-foreground uppercase"
        >Auto format</span
      >
    </div>

    <!-- Body -->
    <div class="relative flex-1 min-h-0 overflow-hidden">
      <!-- Empty state -->
      <div
        v-if="!store.resultBlob && !store.isRendering && !store.renderError"
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
        v-else-if="store.renderError && !store.resultBlob"
        class="absolute inset-0 flex items-center justify-center p-4"
      >
        <Alert variant="destructive" class="max-w-xs">
          <AlertTitle>Render failed</AlertTitle>
          <AlertDescription>{{ store.renderError }}</AlertDescription>
        </Alert>
      </div>

      <!-- Excel download card -->
      <div
        v-else-if="store.resultBlob && !store.isPdfResult"
        class="absolute inset-0 flex items-center justify-center p-6"
      >
        <div class="flex flex-col items-center gap-4 text-center">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/30"
          >
            <FileSpreadsheet class="h-8 w-8 text-green-500" />
          </div>
          <div>
            <p class="text-sm font-medium text-foreground">File ready</p>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ downloadFilename }}
            </p>
          </div>
          <Button variant="outline" size="sm" @click="downloadAgain">
            <Download class="size-3.5 mr-1" />
            Download again
          </Button>
        </div>
      </div>

      <!-- PDF iframe -->
      <iframe
        v-if="objectUrl && store.isPdfResult"
        :src="objectUrl"
        class="absolute inset-0 w-full h-full border-0"
        title="PDF Preview"
      />
    </div>

    <!-- Download button (PDF only) -->
    <a
      v-if="objectUrl && store.isPdfResult"
      :href="objectUrl"
      :download="downloadFilename"
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
import { computed, ref, watch, onUnmounted } from "vue";
import { Download, FileSpreadsheet } from "lucide-vue-next";
import { useReportStore } from "@/stores/reportStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { downloadBlob } from "@/lib/utils";

const store = useReportStore();
const objectUrl = ref<string | null>(null);
const downloadFilename = computed(() => `report${store.resultFileExtension}`);

watch(
  () => store.resultBlob,
  (blob) => {
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value);
      objectUrl.value = null;
    }
    if (!blob) return;

    if (store.isPdfResult) {
      objectUrl.value = URL.createObjectURL(blob);
    } else {
      // Non-PDF: trigger download automatically
      downloadBlob(blob, downloadFilename.value);
    }
  },
);

onUnmounted(() => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
  }
});

function downloadAgain(): void {
  if (store.resultBlob) {
    downloadBlob(store.resultBlob, downloadFilename.value);
  }
}
</script>
