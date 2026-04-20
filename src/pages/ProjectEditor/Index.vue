<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Settings, Save, RotateCcw, ArrowLeft, Circle } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ColorPickerInput from "@/components/ui/ColorPickerInput.vue";
import PageSizePreview from "@/components/ui/PageSizePreview.vue";
import { useProjectStore } from "@/stores/projectStore";
import { useMonacoEditor } from "@/composables/useMonacoEditor";

const router = useRouter();
const store = useProjectStore();

// ── Monaco JSON editor ────────────────────────────────────────────────────────
const jsonEditorRef = ref<HTMLElement | null>(null);
const {
  getValue: getJson,
  setValue: setJson,
  onDidChangeContent,
} = useMonacoEditor(jsonEditorRef, "json", "");

// ── Local state ───────────────────────────────────────────────────────────────
const resetDialogOpen = ref(false);
const jsonError = ref<string | null>(null);

// ── Load on mount ─────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!store.project) {
    await store.load();
  }
  if (store.project) {
    setJson(JSON.stringify(store.project.mockData, null, 2));
  }

  onDidChangeContent(() => {
    if (!store.project) return;
    try {
      store.project.mockData = JSON.parse(getJson());
      store.markDirty();
      jsonError.value = null;
    } catch {
      jsonError.value = "Invalid JSON";
      store.markDirty();
    }
  });
});

// Sync json editor when project reloads (e.g. after reset)
watch(
  () => store.project?.mockData,
  (data) => {
    if (data !== undefined) {
      const serialized = JSON.stringify(data, null, 2);
      if (getJson() !== serialized) {
        setJson(serialized);
      }
    }
  },
);

// ── Page settings helpers ─────────────────────────────────────────────────────
const PAGE_SIZES = ["A4", "A3", "A5", "Letter", "Legal"] as const;
const OUTPUT_FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
] as const;

// Convenience computed that treats pageSettings as non-null when project is loaded
const settings = computed(() => store.project?.pageSettings ?? null);

function patchSettings(patch: Record<string, unknown>) {
  if (!store.project) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store.patchPageSettings(patch as any);
}

// ── Formatted timestamps ──────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function handleSave() {
  await store.save();
}

async function handleReset() {
  resetDialogOpen.value = false;
  await store.reset();
  if (store.project) {
    setJson(JSON.stringify(store.project.mockData, null, 2));
  }
}

function validateJson() {
  try {
    JSON.parse(getJson());
    jsonError.value = null;
  } catch {
    jsonError.value = "Invalid JSON";
  }
}

async function copyJsonToClipboard() {
  await navigator.clipboard.writeText(getJson());
}

// ── Named event handlers (avoid implicit any in template) ─────────────────────
function onNameInput(e: Event) {
  if (!store.project) return;
  store.project.name = (e.target as HTMLInputElement).value;
  store.markDirty();
}

function onDescriptionInput(e: Event) {
  if (!store.project) return;
  store.project.description = (e.target as HTMLTextAreaElement).value || null;
  store.markDirty();
}

function onVersionInput(e: Event) {
  if (!store.project) return;
  store.project.version = (e.target as HTMLInputElement).value;
  store.markDirty();
}

function onOutputFormatChange(e: Event) {
  if (!store.project) return;
  store.project.defaultOutputFormat = (e.target as HTMLSelectElement).value as
    | "pdf"
    | "excel";
  store.markDirty();
}

function onPageSizeChange(e: Event) {
  patchSettings({ pageSize: (e.target as HTMLSelectElement).value });
}

function onMarginHorizontalInput(e: Event) {
  patchSettings({
    marginHorizontal: Number((e.target as HTMLInputElement).value),
  });
}

function onMarginVerticalInput(e: Event) {
  patchSettings({
    marginVertical: Number((e.target as HTMLInputElement).value),
  });
}

function onFontSizeInput(e: Event) {
  patchSettings({
    defaultFontSize: Number((e.target as HTMLInputElement).value),
  });
}

function onShowHeaderChange(e: Event) {
  patchSettings({ showHeader: (e.target as HTMLInputElement).checked });
}

function onShowFooterChange(e: Event) {
  patchSettings({ showFooter: (e.target as HTMLInputElement).checked });
}

function onWatermarkInput(e: Event) {
  patchSettings({
    watermarkText: (e.target as HTMLInputElement).value || null,
  });
}
</script>

<template>
  <div
    class="flex flex-col h-screen overflow-hidden bg-background text-foreground"
  >
    <!-- Header -->
    <header
      class="h-10 shrink-0 flex items-center justify-between px-3 border-b border-border"
    >
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          @click="router.back()"
        >
          <ArrowLeft class="size-3.5" />
        </Button>
        <Settings class="size-3.5 text-muted-foreground" />
        <span
          class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Project Settings
        </span>
        <Circle
          v-if="store.isDirty"
          class="size-2 fill-orange-400 text-orange-400"
          aria-label="Unsaved changes"
        />
      </div>
    </header>

    <!-- Body -->
    <div
      v-if="store.isLoading && !store.project"
      class="flex-1 flex items-center justify-center"
    >
      <span class="text-sm text-muted-foreground">Loading…</span>
    </div>

    <div
      v-else-if="!store.project"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center space-y-2">
        <p class="text-sm text-muted-foreground">
          {{ store.error ?? "Project not found." }}
        </p>
        <Button size="sm" @click="store.load()">Retry</Button>
      </div>
    </div>

    <template v-else>
      <Tabs
        default-value="metadata"
        class="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <TabsList
          class="shrink-0 px-3 justify-start rounded-none border-b border-border bg-transparent h-9"
        >
          <TabsTrigger value="metadata" class="text-xs">Metadata</TabsTrigger>
          <TabsTrigger value="page-settings" class="text-xs"
            >Page Settings</TabsTrigger
          >
          <TabsTrigger value="mock-data" class="text-xs"
            >Global Mock Data</TabsTrigger
          >
        </TabsList>

        <!-- ── Tab 1: Metadata ──────────────────────────────────────────── -->
        <TabsContent
          value="metadata"
          class="flex-1 min-h-0 overflow-y-auto p-6 space-y-5"
        >
          <div class="grid grid-cols-1 gap-5 max-w-lg">
            <!-- Name -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-muted-foreground">Project name</label>
              <Input
                :value="store.project.name"
                placeholder="My Project"
                @input="onNameInput"
              />
            </div>

            <!-- Description -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-muted-foreground">Description</label>
              <textarea
                :value="store.project.description ?? ''"
                rows="3"
                class="w-full rounded-none border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder="Optional project description"
                @input="onDescriptionInput"
              />
            </div>

            <!-- Version -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-muted-foreground">Version</label>
              <Input
                :value="store.project.version"
                placeholder="1.0.0"
                pattern="\d+\.\d+\.\d+"
                @input="onVersionInput"
              />
            </div>

            <!-- Default output format -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-muted-foreground"
                >Default output format</label
              >
              <select
                :value="store.project.defaultOutputFormat"
                class="h-8 w-full rounded-none border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                @change="onOutputFormatChange"
              >
                <option
                  v-for="fmt in OUTPUT_FORMATS"
                  :key="fmt.value"
                  :value="fmt.value"
                >
                  {{ fmt.label }}
                </option>
              </select>
            </div>

            <!-- Timestamps (read-only) -->
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-xs text-muted-foreground">Created at</label>
                <span class="text-xs text-foreground/70">{{
                  formatDate(store.project.createdAt)
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-muted-foreground">Updated at</label>
                <span class="text-xs text-foreground/70">{{
                  formatDate(store.project.updatedAt)
                }}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- ── Tab 2: Page Settings ─────────────────────────────────────── -->
        <TabsContent
          value="page-settings"
          class="flex-1 min-h-0 overflow-y-auto p-6"
        >
          <div v-if="settings" class="flex gap-10 max-w-3xl">
            <!-- Form -->
            <div class="flex-1 space-y-5">
              <!-- Page size -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground">Page size</label>
                <select
                  :value="settings.pageSize"
                  class="h-8 w-full rounded-none border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  @change="onPageSizeChange"
                >
                  <option v-for="sz in PAGE_SIZES" :key="sz" :value="sz">
                    {{ sz }}
                  </option>
                </select>
              </div>

              <!-- Margins -->
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs text-muted-foreground"
                    >Margin horizontal (cm)</label
                  >
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    :value="settings.marginHorizontal"
                    class="h-8"
                    @input="onMarginHorizontalInput"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs text-muted-foreground"
                    >Margin vertical (cm)</label
                  >
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    :value="settings.marginVertical"
                    class="h-8"
                    @input="onMarginVerticalInput"
                  />
                </div>
              </div>

              <!-- Colors -->
              <div class="grid grid-cols-2 gap-4">
                <ColorPickerInput
                  :model-value="settings.backgroundColor"
                  label="Background color"
                  @update:model-value="
                    patchSettings({ backgroundColor: $event })
                  "
                />
                <ColorPickerInput
                  :model-value="settings.defaultTextColor"
                  label="Default text color"
                  @update:model-value="
                    patchSettings({ defaultTextColor: $event })
                  "
                />
              </div>

              <!-- Font size -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground"
                  >Default font size (pt)</label
                >
                <div class="flex items-center gap-2">
                  <Input
                    type="number"
                    min="6"
                    max="72"
                    :value="settings.defaultFontSize"
                    class="h-8 w-24"
                    @input="onFontSizeInput"
                  />
                  <span class="text-xs text-muted-foreground">pt</span>
                </div>
              </div>

              <!-- Header / Footer toggles -->
              <div class="flex items-center gap-6">
                <label
                  class="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    :checked="settings.showHeader"
                    class="accent-primary"
                    @change="onShowHeaderChange"
                  />
                  <span class="text-xs">Show header</span>
                </label>
                <label
                  class="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    :checked="settings.showFooter"
                    class="accent-primary"
                    @change="onShowFooterChange"
                  />
                  <span class="text-xs">Show footer</span>
                </label>
              </div>

              <!-- Watermark -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground"
                  >Watermark text (optional)</label
                >
                <div class="flex items-center gap-2">
                  <Input
                    :value="settings.watermarkText ?? ''"
                    placeholder="e.g. DRAFT"
                    class="h-8"
                    @input="onWatermarkInput"
                  />
                  <Button
                    v-if="settings.watermarkText"
                    variant="ghost"
                    size="sm"
                    @click="patchSettings({ watermarkText: null })"
                    >Clear</Button
                  >
                </div>
              </div>
            </div>

            <!-- Live preview -->
            <div class="shrink-0 pt-1">
              <p class="text-xs text-muted-foreground mb-3">Preview</p>
              <PageSizePreview :settings="settings" />
            </div>
          </div>
        </TabsContent>

        <!-- ── Tab 3: Global Mock Data ──────────────────────────────────── -->
        <TabsContent value="mock-data" class="flex-1 min-h-0 flex flex-col p-0">
          <!-- Toolbar -->
          <div
            class="shrink-0 flex items-center gap-2 px-3 h-9 border-b border-border"
          >
            <Button size="xs" variant="outline" @click="validateJson">
              Validate JSON
            </Button>
            <Button size="xs" variant="ghost" @click="copyJsonToClipboard">
              Copy to clipboard
            </Button>
            <span v-if="jsonError" class="ml-2 text-xs text-destructive">{{
              jsonError
            }}</span>
          </div>

          <!-- Monaco editor container -->
          <div ref="jsonEditorRef" class="flex-1 min-h-0" />
        </TabsContent>
      </Tabs>

      <!-- ── Sticky footer ─────────────────────────────────────────────────── -->
      <div
        class="shrink-0 flex items-center justify-between px-4 h-11 border-t border-border bg-background"
      >
        <div class="flex items-center gap-1.5">
          <Circle
            v-if="store.isDirty"
            class="size-2 fill-orange-400 text-orange-400"
          />
          <span v-if="store.isDirty" class="text-xs text-muted-foreground"
            >Unsaved changes</span
          >
          <span v-if="store.error" class="text-xs text-destructive ml-2">{{
            store.error
          }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            @click="resetDialogOpen = true"
          >
            <RotateCcw class="size-3" />
            Reset to defaults
          </Button>
          <Button size="sm" :disabled="store.isLoading" @click="handleSave">
            <Save class="size-3" />
            Save
          </Button>
        </div>
      </div>
    </template>

    <!-- Reset confirmation dialog -->
    <AlertDialog v-model:open="resetDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset to factory defaults?</AlertDialogTitle>
          <AlertDialogDescription>
            All project settings will be restored to their defaults. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="resetDialogOpen = false"
            >Cancel</AlertDialogCancel
          >
          <AlertDialogAction @click="handleReset">Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
