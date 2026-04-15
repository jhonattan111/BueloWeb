<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Artefact</DialogTitle>
        <DialogDescription>
          Choose a type and enter a name (lowercase, hyphens allowed).
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 py-2">
        <!-- Type select -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium">Type</label>
          <select
            v-model="selectedType"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option
              v-for="t in ARTEFACT_TYPES"
              :key="t.extension"
              :value="t.extension"
            >
              {{ t.label }}
            </option>
          </select>
        </div>

        <!-- Name input -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium">Name</label>
          <Input
            v-model="name"
            placeholder="e.g. my-helpers"
            :class="nameError ? 'border-destructive' : ''"
            @keydown.enter="confirm"
          />
          <p v-if="nameError" class="text-xs text-destructive">
            {{ nameError }}
          </p>
          <p class="text-xs text-muted-foreground">
            File will be saved as <code>{{ preview }}</code>
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)"
          >Cancel</Button
        >
        <Button :disabled="!!nameError || !name" @click="confirm">Add</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TemplateArtefact } from "@/types/template";

const ARTEFACT_TYPES = [
  { label: "Mock Data (.data.json)", extension: ".data.json" },
  { label: "Schema (.schema.json)", extension: ".schema.json" },
  { label: "Helpers (.helpers.cs)", extension: ".helpers.cs" },
  { label: "Custom (.cs)", extension: ".cs" },
] as const;

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  add: [artefact: TemplateArtefact];
}>();

const name = ref("");
const selectedType = ref<string>(ARTEFACT_TYPES[0].extension);

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

const nameError = computed(() => {
  if (!name.value) return null;
  return SLUG_RE.test(name.value)
    ? null
    : "Only lowercase letters, digits, and hyphens allowed.";
});

const preview = computed(() =>
  name.value ? `${name.value}${selectedType.value}` : "…",
);

// Reset on open
watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = "";
      selectedType.value = ARTEFACT_TYPES[0].extension;
    }
  },
);

function confirm() {
  if (nameError.value || !name.value) return;
  emit("add", {
    name: name.value,
    extension: selectedType.value,
    content: "",
  });
  emit("update:open", false);
}
</script>
