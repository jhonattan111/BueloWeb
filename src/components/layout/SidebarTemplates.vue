<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-3 h-10 shrink-0 border-b border-border"
    >
      <span
        class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >Templates</span
      >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="New template"
        @click="store.createTemplate()"
      >
        <Plus class="size-4" />
      </Button>
    </div>

    <!-- List -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="p-2 flex flex-col gap-0.5">
        <p
          v-if="store.templates.length === 0"
          class="px-2 py-1.5 text-xs text-muted-foreground"
        >
          No templates yet.
        </p>

        <div
          v-for="template in store.templates"
          :key="template.id"
          :class="[
            'group flex items-center justify-between rounded-none px-2 py-1.5 cursor-pointer text-xs',
            store.activeTemplateId === template.id
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-muted',
          ]"
          @click="store.selectTemplate(template.id)"
        >
          <span class="truncate flex-1 min-w-0">{{ template.name }}</span>

          <!-- Action buttons (visible on hover) -->
          <div
            class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 ml-1"
          >
            <!-- Rename Dialog -->
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
                  <Button @click="confirmRename(template.id)">Rename</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <!-- Delete AlertDialog -->
            <AlertDialog v-model:open="deleteDialogOpen[template.id]">
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
                    Are you sure you want to delete "{{ template.name }}"? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction @click="store.deleteTemplate(template.id)"
                    >Delete</AlertDialogAction
                  >
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { Pencil, Plus, Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const store = useTemplateStore();

const renameDialogOpen = reactive<Record<string, boolean>>({});
const deleteDialogOpen = reactive<Record<string, boolean>>({});
const renameValue = ref("");

function openRename(id: string, currentName: string) {
  renameValue.value = currentName;
  renameDialogOpen[id] = true;
}

function confirmRename(id: string) {
  const name = renameValue.value.trim();
  if (name) {
    store.updateTemplate(id, { name });
  }
  renameDialogOpen[id] = false;
}
</script>
