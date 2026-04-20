<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ChevronDown, ChevronRight } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useReportSettings } from "@/composables/useReportSettings";

const PAGE_SIZES = ["A4", "A3", "A5", "Letter", "Legal"] as const;
const ORIENTATIONS = ["Portrait", "Landscape"] as const;

const isOpen = ref(false);

const {
  settings,
  jsonFiles,
  canEdit,
  invalidDataSource,
  isSaving,
  saveError,
  refreshJsonFiles,
  apply,
} = useReportSettings();

onMounted(() => {
  refreshJsonFiles();
});

const dataSourceError = computed(() => {
  if (!settings.value.dataSourcePath) return null;
  if (!invalidDataSource.value) return null;
  return "Selected JSON file does not exist in workspace.";
});
</script>

<template>
  <section class="border-t border-border bg-background/80 shrink-0">
    <button
      type="button"
      class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:bg-muted/40 transition-colors"
      @click="isOpen = !isOpen"
    >
      <span>Report Settings</span>
      <ChevronDown v-if="isOpen" class="size-3.5" />
      <ChevronRight v-else class="size-3.5" />
    </button>

    <div v-if="isOpen" class="px-3 pb-3 pt-2 border-t border-border space-y-3">
      <p v-if="!canEdit" class="text-xs text-muted-foreground">
        Select an active .buelo tab to edit report settings.
      </p>

      <template v-else>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-[11px] text-muted-foreground">Page Size</label>
            <select
              v-model="settings.pageSize"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              <option v-for="size in PAGE_SIZES" :key="size" :value="size">
                {{ size }}
              </option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-[11px] text-muted-foreground">Orientation</label>
            <select
              v-model="settings.orientation"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              <option
                v-for="orientation in ORIENTATIONS"
                :key="orientation"
                :value="orientation"
              >
                {{ orientation }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-[11px] text-muted-foreground">Margin H</label>
            <input
              v-model.number="settings.marginHorizontal"
              type="number"
              min="0"
              step="0.1"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            />
          </div>

          <div class="space-y-1">
            <label class="text-[11px] text-muted-foreground">Margin V</label>
            <input
              v-model.number="settings.marginVertical"
              type="number"
              min="0"
              step="0.1"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-[11px] text-muted-foreground">Background</label>
            <div class="flex items-center gap-2">
              <input
                v-model="settings.backgroundColor"
                type="text"
                class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              />
              <input
                v-model="settings.backgroundColor"
                type="color"
                class="h-8 w-10 rounded-md border border-input bg-background p-1"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[11px] text-muted-foreground">Text Color</label>
            <div class="flex items-center gap-2">
              <input
                v-model="settings.defaultTextColor"
                type="text"
                class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              />
              <input
                v-model="settings.defaultTextColor"
                type="color"
                class="h-8 w-10 rounded-md border border-input bg-background p-1"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-[11px] text-muted-foreground">Font Size</label>
            <input
              v-model.number="settings.defaultFontSize"
              type="number"
              min="6"
              step="1"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            />
          </div>

          <div class="space-y-1">
            <label class="text-[11px] text-muted-foreground"
              >Output Format</label
            >
            <select
              v-model="settings.outputFormat"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[11px] text-muted-foreground"
            >Data source (.json)</label
          >
          <select
            v-model="settings.dataSourcePath"
            class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            @focus="refreshJsonFiles"
          >
            <option value="">None</option>
            <option
              v-for="jsonPath in jsonFiles"
              :key="jsonPath"
              :value="jsonPath"
            >
              {{ jsonPath }}
            </option>
          </select>
          <p v-if="dataSourceError" class="text-xs text-destructive">
            {{ dataSourceError }}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <label
            class="inline-flex items-center gap-2 text-xs text-muted-foreground"
          >
            <input v-model="settings.showHeader" type="checkbox" />
            Show Header
          </label>
          <label
            class="inline-flex items-center gap-2 text-xs text-muted-foreground"
          >
            <input v-model="settings.showFooter" type="checkbox" />
            Show Footer
          </label>
        </div>

        <div class="space-y-1">
          <label class="text-[11px] text-muted-foreground">Watermark</label>
          <input
            v-model="settings.watermarkText"
            type="text"
            class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
            placeholder="Optional watermark"
          />
        </div>

        <p v-if="saveError" class="text-xs text-destructive">{{ saveError }}</p>

        <Button size="sm" class="w-full" :disabled="isSaving" @click="apply">
          {{ isSaving ? "Applying..." : "Apply to file" }}
        </Button>
      </template>
    </div>
  </section>
</template>
