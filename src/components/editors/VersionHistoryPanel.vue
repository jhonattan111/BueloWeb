<template>
  <div class="absolute inset-0 z-10 flex bg-background">
    <!-- Version list sidebar -->
    <div class="w-52 shrink-0 border-r border-border flex flex-col">
      <div
        class="flex items-center justify-between px-3 h-10 shrink-0 border-b border-border"
      >
        <span class="text-xs font-semibold">Version History</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          @click="$emit('close')"
        >
          <X class="size-4" />
        </Button>
      </div>

      <ScrollArea class="flex-1 min-h-0">
        <div class="p-2 flex flex-col gap-0.5">
          <template v-if="loading">
            <div
              v-for="n in 4"
              :key="n"
              class="h-10 rounded bg-muted animate-pulse"
            />
          </template>

          <p
            v-else-if="versions.length === 0"
            class="px-2 py-1.5 text-xs text-muted-foreground"
          >
            No history yet.
          </p>

          <button
            v-else
            v-for="v in versions"
            :key="v.version"
            :class="[
              'w-full text-left px-2 py-1.5 rounded transition-colors',
              selectedVersion === v.version
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-muted',
            ]"
            @click="selectVersion(v)"
          >
            <div class="text-xs font-medium">Version {{ v.version }}</div>
            <div class="text-xs text-muted-foreground">
              {{ relativeTime(v.savedAt) }}
              <span v-if="v.savedBy"> · {{ v.savedBy }}</span>
            </div>
          </button>
        </div>
      </ScrollArea>
    </div>

    <!-- Preview pane -->
    <div class="flex-1 min-w-0 flex flex-col min-h-0">
      <!-- Preview toolbar -->
      <div
        class="flex items-center gap-2 px-3 h-10 shrink-0 border-b border-border"
      >
        <span class="text-xs text-muted-foreground">
          <template v-if="selectedVersion !== null">
            Version {{ selectedVersion }} — read only
          </template>
          <template v-else>Select a version to preview</template>
        </span>
        <div class="flex-1" />
        <Button
          size="sm"
          variant="secondary"
          :disabled="selectedVersion === null || isActing"
          @click="renderVersion"
        >
          Render
        </Button>
        <Button
          size="sm"
          :disabled="selectedVersion === null || isActing"
          @click="restore"
        >
          <span v-if="isActing">Restoring…</span>
          <span v-else>Restore</span>
        </Button>
      </div>

      <!-- Read-only Monaco editor -->
      <div ref="previewContainerRef" class="flex-1 min-h-0" />

      <!-- Inline notification -->
      <div
        v-if="statusMessage"
        class="px-3 py-1.5 text-xs border-t border-border shrink-0"
        :class="
          statusMessage.type === 'error'
            ? 'text-destructive bg-destructive/5'
            : 'text-foreground bg-muted'
        "
      >
        {{ statusMessage.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMonacoEditor } from "@/composables/useMonacoEditor";
import * as templateService from "@/services/templateService";
import { useReportStore } from "@/stores/reportStore";
import { useTemplateStore } from "@/stores/templateStore";
import type { TemplateVersionMeta, Template } from "@/types/template";

const props = defineProps<{ templateId: string }>();
const emit = defineEmits<{
  close: [];
  restore: [template: Template];
}>();

const reportStore = useReportStore();
const templateStore = useTemplateStore();

// ── Version list ──────────────────────────────────────────────────────────────
const versions = ref<TemplateVersionMeta[]>([]);
const selectedVersion = ref<number | null>(null);
const loading = ref(false);

async function loadVersions() {
  loading.value = true;
  try {
    versions.value = await templateService.listVersions(props.templateId);
  } finally {
    loading.value = false;
  }
}

onMounted(loadVersions);

// ── Read-only preview editor ──────────────────────────────────────────────────
const previewContainerRef = ref<HTMLElement | null>(null);
const { setValue } = useMonacoEditor(previewContainerRef, "buelo", "", {
  readOnly: true,
});

async function selectVersion(meta: TemplateVersionMeta) {
  selectedVersion.value = meta.version;
  try {
    const snapshot = await templateService.getVersion(
      props.templateId,
      meta.version,
    );
    setValue(snapshot.template);
  } catch {
    setStatus("error", "Failed to load version.");
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────
const isActing = ref(false);
const statusMessage = ref<{ type: "info" | "error"; text: string } | null>(
  null,
);
let statusTimer: ReturnType<typeof setTimeout> | null = null;

function setStatus(type: "info" | "error", text: string) {
  if (statusTimer) clearTimeout(statusTimer);
  statusMessage.value = { type, text };
  statusTimer = setTimeout(() => (statusMessage.value = null), 4000);
}

async function restore() {
  if (selectedVersion.value === null) return;
  isActing.value = true;
  try {
    const restored = await templateService.restoreVersion(
      props.templateId,
      selectedVersion.value,
    );
    setStatus(
      "info",
      `Version ${selectedVersion.value} restored as version ${restored.artefacts ? versions.value.length + 1 : "latest"}.`,
    );
    emit("restore", restored);
    await loadVersions();
  } catch (e) {
    setStatus("error", e instanceof Error ? e.message : "Restore failed.");
  } finally {
    isActing.value = false;
  }
}

// ── Render historical version ─────────────────────────────────────────────────
async function renderVersion() {
  if (selectedVersion.value === null) return;
  const id = templateStore.activeTemplateId;
  if (!id) return;
  await reportStore.renderTemplate(id, selectedVersion.value);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
</script>
