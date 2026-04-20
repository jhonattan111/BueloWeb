<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ChevronDown, ChevronRight } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useTemplateStore } from "@/stores/templateStore";
import { useActiveTemplate } from "@/composables/useActiveTemplate";

interface ProjectSettings {
  pageSize: string;
  orientation: string;
  marginHorizontal?: number;
  marginVertical?: number;
  backgroundColor?: string;
  defaultTextColor?: string;
  defaultFontSize?: number;
  showHeader: boolean;
  showFooter: boolean;
  watermarkText?: string;
}

const DEFAULT_SETTINGS: ProjectSettings = {
  pageSize: "A4",
  orientation: "Portrait",
  marginHorizontal: 2,
  marginVertical: 2,
  backgroundColor: "#FFFFFF",
  defaultTextColor: "#000000",
  defaultFontSize: 12,
  showHeader: true,
  showFooter: true,
  watermarkText: "",
};

const PAGE_SIZES = ["A4", "A3", "A5", "Letter", "Legal"] as const;
const ORIENTATIONS = ["Portrait", "Landscape"] as const;

const templateStore = useTemplateStore();
const { files, saveFile } = useActiveTemplate();

const isOpen = ref(false);
const isSaving = ref(false);
const saveError = ref<string | null>(null);
const settings = ref<ProjectSettings>({ ...DEFAULT_SETTINGS });

const templatePath = computed(() => {
  const name = templateStore.activeTemplate?.name;
  if (!name) return "";
  return name.endsWith(".buelo") ? name : `${name}.buelo`;
});

const templateSource = computed(
  () =>
    files.value.find((file) => file.path === templatePath.value)?.content ?? "",
);

const canEdit = computed(
  () =>
    Boolean(templateStore.activeTemplateId) && Boolean(templateSource.value),
);

watch(
  templateSource,
  (source) => {
    if (!source) {
      settings.value = { ...DEFAULT_SETTINGS };
      return;
    }

    settings.value = {
      ...DEFAULT_SETTINGS,
      ...parseProjectBlock(source),
    };
  },
  { immediate: true },
);

async function applyToFile(): Promise<void> {
  if (!canEdit.value) return;

  isSaving.value = true;
  saveError.value = null;
  try {
    const block = serializeProjectBlock(settings.value);
    const content = upsertProjectBlock(templateSource.value, block);
    await saveFile({ path: templatePath.value, content });
  } catch (err) {
    saveError.value =
      err instanceof Error ? err.message : "Failed to apply settings";
  } finally {
    isSaving.value = false;
  }
}

function serializeProjectBlock(state: ProjectSettings): string {
  const lines = ["@project"];
  if (state.pageSize) lines.push(`  pageSize: ${state.pageSize}`);
  if (state.orientation) lines.push(`  orientation: ${state.orientation}`);
  if (state.marginHorizontal != null) {
    lines.push(`  marginHorizontal: ${state.marginHorizontal}`);
  }
  if (state.marginVertical != null) {
    lines.push(`  marginVertical: ${state.marginVertical}`);
  }
  if (state.backgroundColor) {
    lines.push(`  backgroundColor: "${state.backgroundColor}"`);
  }
  if (state.defaultTextColor) {
    lines.push(`  defaultTextColor: "${state.defaultTextColor}"`);
  }
  if (state.defaultFontSize != null) {
    lines.push(`  defaultFontSize: ${state.defaultFontSize}`);
  }
  lines.push(`  showHeader: ${state.showHeader}`);
  lines.push(`  showFooter: ${state.showFooter}`);
  if (state.watermarkText) {
    lines.push(`  watermarkText: "${state.watermarkText}"`);
  }
  return lines.join("\n");
}

function parseProjectBlock(source: string): Partial<ProjectSettings> {
  const match = source.match(/@project\s*\n((?:[ \t]+.+\n?)*)/);
  if (!match) return {};

  const block = match[1];
  const kv = Object.fromEntries(
    block
      .split("\n")
      .map((line) => line.trim().match(/^(\w+):\s*(.+)$/))
      .filter(Boolean)
      .map((entry) => [entry![1], entry![2].replace(/^"|"$/g, "")]),
  );

  return {
    pageSize: kv["pageSize"],
    orientation: kv["orientation"],
    marginHorizontal: kv["marginHorizontal"]
      ? Number(kv["marginHorizontal"])
      : undefined,
    marginVertical: kv["marginVertical"]
      ? Number(kv["marginVertical"])
      : undefined,
    backgroundColor: kv["backgroundColor"],
    defaultTextColor: kv["defaultTextColor"],
    defaultFontSize: kv["defaultFontSize"]
      ? Number(kv["defaultFontSize"])
      : undefined,
    showHeader: kv["showHeader"] ? kv["showHeader"] === "true" : undefined,
    showFooter: kv["showFooter"] ? kv["showFooter"] === "true" : undefined,
    watermarkText: kv["watermarkText"],
  };
}

function upsertProjectBlock(source: string, block: string): string {
  const pattern = /^@project\s*\r?\n(?:[ \t]+.*(?:\r?\n|$))*/;
  if (pattern.test(source)) {
    return source.replace(pattern, `${block}\n`);
  }

  return source.trim().length > 0 ? `${block}\n\n${source}` : `${block}\n`;
}
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
        Open a .buelo file to configure settings.
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

        <Button
          size="sm"
          class="w-full"
          :disabled="isSaving"
          @click="applyToFile"
        >
          {{ isSaving ? "Applying..." : "Apply to file" }}
        </Button>
      </template>
    </div>
  </section>
</template>
