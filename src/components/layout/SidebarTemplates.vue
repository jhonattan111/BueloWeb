<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-2 h-10 shrink-0 border-b border-border gap-1"
    >
      <span
        class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        Templates
      </span>
      <div class="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          class="size-6"
          title="Import template"
          @click="onImport"
        >
          <Upload class="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-6"
          title="New template"
          @click="onNew"
        >
          <Plus class="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-6"
          :disabled="store.isLoading"
          title="Refresh"
          @click="store.fetchTemplates()"
        >
          <RefreshCw
            class="size-3.5"
            :class="{ 'animate-spin': store.isLoading }"
          />
        </Button>
      </div>
    </div>

    <!-- Search -->
    <div class="px-2 py-1.5 shrink-0 border-b border-border">
      <div class="relative">
        <Search
          class="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none"
        />
        <Input
          v-model="search"
          placeholder="Search templates…"
          class="h-6 text-xs pl-6 pr-2"
        />
      </div>
    </div>

    <!-- Template list -->
    <ScrollArea class="flex-1 min-h-0">
      <!-- Loading -->
      <div
        v-if="store.isLoading && !store.templates.length"
        class="flex items-center justify-center py-8"
      >
        <div
          class="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin"
        />
      </div>

      <!-- Empty -->
      <div v-else-if="!filtered.length" class="px-3 py-6 text-center">
        <p class="text-[11px] text-muted-foreground">
          {{
            search
              ? "No templates match your search."
              : "No templates yet. Click + to create one."
          }}
        </p>
      </div>

      <!-- Items -->
      <div v-else class="py-1">
        <div
          v-for="tpl in filtered"
          :key="tpl.id"
          class="group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-muted/60 rounded mx-1 my-0.5"
          :class="{
            'bg-accent text-accent-foreground':
              store.activeTemplateId === tpl.id,
          }"
          @click="onSelect(tpl.id)"
        >
          <FileCode class="size-3.5 shrink-0 text-blue-400" />
          <span
            v-if="renamingId !== tpl.id"
            class="flex-1 min-w-0 text-[12px] truncate"
            >{{ tpl.name }}</span
          >
          <input
            v-else
            ref="renameInputRef"
            v-model="renameValue"
            class="flex-1 min-w-0 text-[12px] bg-transparent border-b border-primary outline-none"
            @keydown.enter="commitRename(tpl.id)"
            @keydown.escape="renamingId = null"
            @blur="renamingId = null"
          />

          <!-- Format badge -->
          <span
            class="hidden group-hover:inline text-[9px] px-1 py-0.5 rounded border uppercase font-medium shrink-0"
            :class="
              tpl.outputFormat === 'excel'
                ? 'border-green-500/40 text-green-500'
                : 'border-red-400/40 text-red-400'
            "
          >
            {{ tpl.outputFormat === "excel" ? "XLS" : "PDF" }}
          </span>

          <!-- Action buttons (visible on hover) -->
          <div class="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              class="p-0.5 hover:text-foreground text-muted-foreground rounded"
              title="Rename"
              @click.stop="startRename(tpl.id, tpl.name)"
            >
              <Pencil class="size-2.5" />
            </button>
            <button
              class="p-0.5 hover:text-foreground text-muted-foreground rounded"
              title="Duplicate"
              @click.stop="onDuplicate(tpl)"
            >
              <Copy class="size-2.5" />
            </button>
            <button
              class="p-0.5 hover:text-foreground text-muted-foreground rounded"
              title="Export as JSON"
              @click.stop="onExport(tpl)"
            >
              <Download class="size-2.5" />
            </button>
            <button
              class="p-0.5 hover:text-destructive text-muted-foreground rounded"
              title="Delete"
              @click.stop="confirmDelete(tpl)"
            >
              <Trash2 class="size-2.5" />
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- Error banner -->
    <div
      v-if="store.error"
      class="px-2 py-1.5 text-[11px] text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ store.error }}
    </div>

    <!-- Delete confirmation dialog -->
    <AlertDialog
      :open="deleteTarget !== null"
      @update:open="
        (v) => {
          if (!v) deleteTarget = null;
        }
      "
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete template?</AlertDialogTitle>
          <AlertDialogDescription>
            "{{ deleteTarget?.name }}" will be permanently deleted. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteTarget = null"
            >Cancel</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="executeDelete"
            >Delete</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- New template dialog -->
    <Dialog
      :open="newDialogOpen"
      @update:open="
        (v) => {
          if (!v) newDialogOpen = false;
        }
      "
    >
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Template</DialogTitle>
          <DialogDescription
            >Enter a name for the new C# report template.</DialogDescription
          >
        </DialogHeader>
        <div class="space-y-3 py-2">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Name</label>
            <Input
              v-model="newName"
              placeholder="e.g. Sales Report"
              class="text-sm"
              @keydown.enter="executeNew"
            />
          </div>
          <div class="flex gap-3">
            <label class="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                v-model="newFormat"
                type="radio"
                value="pdf"
                class="accent-primary"
              />
              PDF
            </label>
            <label class="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                v-model="newFormat"
                type="radio"
                value="excel"
                class="accent-primary"
              />
              Excel
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" @click="newDialogOpen = false"
            >Cancel</Button
          >
          <Button
            size="sm"
            :disabled="!newName.trim() || store.isLoading"
            @click="executeNew"
            >Create</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Hidden file input for import -->
    <input
      ref="importInputRef"
      type="file"
      accept=".json,.blt"
      class="hidden"
      @change="handleImportFile"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  Copy,
  Download,
  FileCode,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTemplateStore } from "@/stores/templateStore";
import { downloadBlob } from "@/lib/utils";
import { BUELO_STARTER_TEMPLATE } from "@/lib/buelo-language/snippets";
import type { Template } from "@/types/template";

const store = useTemplateStore();

// ── Search ────────────────────────────────────────────────────────────────────
const search = ref("");
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return store.templates;
  return store.templates.filter((t) => t.name.toLowerCase().includes(q));
});

// ── Select ────────────────────────────────────────────────────────────────────
function onSelect(id: string): void {
  store.selectTemplate(id);
}

// ── Rename ────────────────────────────────────────────────────────────────────
const renamingId = ref<string | null>(null);
const renameValue = ref("");
const renameInputRef = ref<HTMLInputElement | null>(null);

function startRename(id: string, name: string): void {
  renamingId.value = id;
  renameValue.value = name;
  nextTick(() => renameInputRef.value?.select());
}

async function commitRename(id: string): Promise<void> {
  const name = renameValue.value.trim();
  if (name) await store.updateTemplate(id, { name });
  renamingId.value = null;
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteTarget = ref<Template | null>(null);

function confirmDelete(tpl: Template): void {
  deleteTarget.value = tpl;
}

async function executeDelete(): Promise<void> {
  if (deleteTarget.value) {
    await store.deleteTemplate(deleteTarget.value.id);
  }
  deleteTarget.value = null;
}

// ── Duplicate ─────────────────────────────────────────────────────────────────
async function onDuplicate(tpl: Template): Promise<void> {
  await store.createTemplate({
    name: `${tpl.name} (copy)`,
    template: tpl.template,
    outputFormat: tpl.outputFormat,
  });
}

// ── New ───────────────────────────────────────────────────────────────────────
const newDialogOpen = ref(false);
const newName = ref("");
const newFormat = ref<"pdf" | "excel">("pdf");

function onNew(): void {
  newName.value = "";
  newFormat.value = "pdf";
  newDialogOpen.value = true;
}

async function executeNew(): Promise<void> {
  if (!newName.value.trim()) return;
  await store.createTemplate({
    name: newName.value.trim(),
    template: BUELO_STARTER_TEMPLATE,
    outputFormat: newFormat.value,
  });
  newDialogOpen.value = false;
}

// ── Export ────────────────────────────────────────────────────────────────────
function onExport(tpl: Template): void {
  const payload = {
    name: tpl.name,
    template: tpl.template,
    outputFormat: tpl.outputFormat ?? "pdf",
    mockData: tpl.mockData,
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const safeName = tpl.name
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  downloadBlob(blob, `${safeName}.blt.json`);
}

// ── Import ────────────────────────────────────────────────────────────────────
const importInputRef = ref<HTMLInputElement | null>(null);

function onImport(): void {
  importInputRef.value?.click();
}

async function handleImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = ""; // reset so same file can be re-imported

  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as {
      name?: string;
      template?: string;
      outputFormat?: "pdf" | "excel";
      mockData?: object;
    };
    const name =
      (
        parsed.name ?? file.name.replace(/\.(blt\.json|json|blt)$/i, "")
      ).trim() || "Imported Template";
    await store.createTemplate({
      name,
      template: parsed.template ?? BUELO_STARTER_TEMPLATE,
      outputFormat: parsed.outputFormat ?? "pdf",
    });
  } catch {
    // silently ignore malformed files
  }
}
</script>
