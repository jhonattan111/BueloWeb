<script setup lang="ts">
import { computed } from "vue";
import type { PageSettings } from "@/services/projectService";

const props = defineProps<{
  settings: PageSettings;
}>();

// Aspect ratios (width / height)
const PAGE_RATIOS: Record<string, number> = {
  A4: 1 / Math.SQRT2,
  A3: 1 / Math.SQRT2,
  A5: 1 / Math.SQRT2,
  Letter: 8.5 / 11,
  Legal: 8.5 / 14,
};

const BASE_WIDTH = 96; // px

const width = computed(() => BASE_WIDTH);
const height = computed(() => {
  const ratio = PAGE_RATIOS[props.settings.pageSize] ?? 1 / Math.SQRT2;
  return Math.round(BASE_WIDTH / ratio);
});

const previewFontSize = computed(() =>
  Math.max(6, Math.round(props.settings.defaultFontSize / 2.5)),
);
</script>

<template>
  <div class="flex flex-col items-center gap-1.5">
    <div
      class="relative overflow-hidden border border-border shadow-sm"
      :style="{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: settings.backgroundColor,
        color: settings.defaultTextColor,
        fontSize: `${previewFontSize}px`,
      }"
    >
      <!-- Header bar -->
      <div
        v-if="settings.showHeader"
        class="absolute top-0 left-0 right-0 flex items-center justify-center border-b border-current/20 bg-current/5"
        style="height: 14px"
      >
        <span class="opacity-50" style="font-size: 7px">H</span>
      </div>

      <!-- Body text sample -->
      <div
        class="absolute inset-0 flex items-center justify-center"
        :style="{
          paddingTop: settings.showHeader ? '14px' : '0',
          paddingBottom: settings.showFooter ? '14px' : '0',
        }"
      >
        <span class="opacity-30" style="pointer-events: none">Aa</span>
      </div>

      <!-- Watermark -->
      <div
        v-if="settings.watermarkText"
        class="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style="transform: rotate(-35deg); opacity: 0.15"
      >
        <span
          class="whitespace-nowrap font-bold uppercase tracking-widest"
          style="font-size: 7px"
          >{{ settings.watermarkText }}</span
        >
      </div>

      <!-- Footer bar -->
      <div
        v-if="settings.showFooter"
        class="absolute bottom-0 left-0 right-0 flex items-center justify-center border-t border-current/20 bg-current/5"
        style="height: 14px"
      >
        <span class="opacity-50" style="font-size: 7px">F</span>
      </div>
    </div>
    <span class="text-xs text-muted-foreground">{{ settings.pageSize }}</span>
  </div>
</template>
