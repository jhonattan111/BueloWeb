<template>
  <div class="flex flex-col h-full min-h-0">
    <div
      class="flex items-center justify-between px-3 h-10 shrink-0 border-b border-border"
    >
      <span
        class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >Workspace</span
      >
      <div class="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New template"
          @click="store.createTemplate()"
        >
          <Plus class="size-4" />
        </Button>
      </div>
    </div>

    <div v-if="store.error" class="px-2 pt-2 shrink-0">
      <Alert variant="destructive">
        <AlertDescription>{{ store.error }}</AlertDescription>
        <AlertAction>
          <Button size="xs" variant="outline" @click="store.fetchTemplates()"
            >Retry</Button
          >
        </AlertAction>
      </Alert>
    </div>

    <ScrollArea class="flex-1 min-h-0">
      <div class="p-2 flex flex-col gap-1">
        <template v-if="store.isLoading">
          <div
            v-for="n in 3"
            :key="n"
            class="h-7 rounded-none bg-muted animate-pulse"
          />
        </template>

        <p
          v-else-if="store.templates.length === 0 && !store.error"
          class="px-2 py-1.5 text-xs text-muted-foreground"
        >
          No templates yet.
        </p>

        <template v-else>
          <div
            v-for="template in store.templates"
            :key="template.id"
            class="rounded border border-transparent"
            :class="
              store.activeTemplateId === template.id
                ? 'bg-accent/40 border-border'
                : ''
            "
          >
            <div
              class="group flex items-center justify-between px-2 py-1.5 cursor-pointer text-xs hover:bg-muted"
              @click="selectTemplate(template.id)"
            >
              <span class="truncate flex-1 min-w-0 font-medium">{{
                getTemplateDisplayName(template.name)
              }}</span>

              <div
                class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 ml-1"
              >
                <Dialog v-model:open="renameDialogOpen[template.id]">
                  <DialogTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Rename"
                      @click.stop="openRename(template.id, template.name)"
                    >
                      <Pencil class="size-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rename Template</DialogTitle>
                      <DialogDescription
                        >Enter a new name for this template.</DialogDescription
                      >
                    </DialogHeader>
                    <Input
                      v-model="renameValue"
                      placeholder="Template name"
                      @keydown.enter="confirmRename(template.id)"
                    />
                    <DialogFooter>
                      <Button
                        variant="outline"
                        @click="renameDialogOpen[template.id] = false"
                        >Cancel</Button
                      >
                      <Button
                        :disabled="renameValue.trim().length === 0"
                        @click="confirmRename(template.id)"
                        >Rename</Button
                      >
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <AlertDialog
                  v-model:open="deleteTemplateDialogOpen[template.id]"
                >
                  <AlertDialogTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Delete"
                      @click.stop
                    >
                      <Trash2 class="size-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{{
                          getTemplateDisplayName(template.name)
                        }}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        @click="store.deleteTemplate(template.id)"
                        >Delete</AlertDialogAction
                      >
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div
              v-if="store.activeTemplateId === template.id"
              class="px-2 pb-2"
            >
              <div
                class="flex items-center justify-between h-7 border-y border-border/60 mb-1"
              >
                <span
                  class="text-[10px] uppercase tracking-wider text-muted-foreground px-1"
                  >Files</span
                >
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Add file"
                  @click="addDialogOpen = true"
                >
                  <FilePlus2 class="size-3.5" />
                </Button>
              </div>

              <div class="space-y-1">
                <div
                  v-for="group in fileGroups"
                  :key="group.directory"
                  class="space-y-1"
                >
                  <p
                    class="px-1 text-[10px] uppercase tracking-wider text-muted-foreground truncate"
                  >
                    {{ group.label }}
                  </p>

                  <div
                    v-for="file in group.files"
                    :key="file.path"
                    class="group flex items-center gap-1"
                  >
                    <button
                      :class="fileClass(file.path)"
                      :title="file.path"
                      @click="activeFilePath = file.path"
                    >
                      {{ fileName(file.path) }}
                    </button>

                    <button
                      v-if="canDeleteFile(file.path)"
                      class="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      :aria-label="`Delete ${file.path}`"
                      @click.stop="confirmDeleteFile(file.path)"
                    >
                      <X class="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </ScrollArea>

    <AddArtefactDialog v-model:open="addDialogOpen" @add="onAddFile" />

    <AlertDialog v-model:open="deleteFileDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete File</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{{ deletingFilePath }}"? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="executeDeleteFile"
            >Delete</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { FilePlus2, Pencil, Plus, Trash2, X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useTemplateStore } from "@/stores/templateStore";
import { useActiveTemplate } from "@/composables/useActiveTemplate";
import type { TemplateFileKind } from "@/types/template";
import AddArtefactDialog from "@/components/editors/AddArtefactDialog.vue";

const DATA_FILE_PATH = "data/mock.data.json";

const store = useTemplateStore();
const { files, activeFilePath, saveFile, removeFile } = useActiveTemplate();

onMounted(() => store.fetchTemplates());

const renameDialogOpen = reactive<Record<string, boolean>>({});
const deleteTemplateDialogOpen = reactive<Record<string, boolean>>({});
const renameValue = ref("");

const addDialogOpen = ref(false);
const deleteFileDialogOpen = ref(false);
const deletingFilePath = ref("");

const fileGroups = computed(() => {
  const byDir = new Map<string, typeof files.value>();

  for (const file of files.value) {
    const directory = file.path.includes("/")
      ? file.path.slice(0, file.path.lastIndexOf("/"))
      : ".";

    if (!byDir.has(directory)) {
      byDir.set(directory, []);
    }

    byDir.get(directory)!.push(file);
  }

  return Array.from(byDir.entries())
    .map(([directory, grouped]) => ({
      directory,
      label: directory === "." ? "root" : directory,
      files: [...grouped].sort((a, b) =>
        fileName(a.path).localeCompare(fileName(b.path)),
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

function fileName(path: string): string {
  return path.split("/").at(-1) ?? path;
}

function selectTemplate(id: string) {
  store.selectTemplate(id);
  const activeName =
    store.templates.find((template) => template.id === id)?.name ?? "template";
  activeFilePath.value = activeName.endsWith(".buelo")
    ? activeName
    : `${activeName}.buelo`;
}

function openRename(id: string, currentName: string) {
  renameValue.value = currentName;
  renameDialogOpen[id] = true;
}

function confirmRename(id: string) {
  const name = renameValue.value.trim();
  if (!name) return;
  store.updateTemplate(id, { name });
  renameDialogOpen[id] = false;
}

function getTemplateDisplayName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "Untitled template";
}

function fileClass(path: string) {
  const active = activeFilePath.value === path;
  return [
    "flex-1 min-w-0 text-left px-2 py-1 text-xs rounded border transition-colors truncate",
    active
      ? "bg-accent text-accent-foreground border-border"
      : "text-foreground/90 border-transparent hover:bg-muted",
  ];
}

function canDeleteFile(path: string): boolean {
  return path !== DATA_FILE_PATH;
}

function confirmDeleteFile(path: string) {
  deletingFilePath.value = path;
  deleteFileDialogOpen.value = true;
}

async function executeDeleteFile() {
  const path = deletingFilePath.value;
  await removeFile(path);
  if (activeFilePath.value === path) {
    const activeName = store.activeTemplate?.name ?? "template";
    activeFilePath.value = activeName.endsWith(".buelo")
      ? activeName
      : `${activeName}.buelo`;
  }
}

async function onAddFile(payload: {
  path: string;
  content: string;
  kind: TemplateFileKind;
}) {
  if (!store.activeTemplateId) return;

  await saveFile({
    path: payload.path,
    content: payload.content,
    kind: payload.kind,
  });
  activeFilePath.value = payload.path;
}
</script>
