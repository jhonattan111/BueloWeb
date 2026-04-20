<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProjectValidationResult } from "@/services/validateService";

const props = defineProps<{
  result: ProjectValidationResult | null;
  isValidating: boolean;
  error: string | null;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  openFile: [path: string];
}>();

const expanded = reactive<Record<string, boolean>>({});

watch(
  () => props.result,
  (next) => {
    for (const key of Object.keys(expanded)) {
      delete expanded[key];
    }

    if (!next) return;

    for (const file of next.files) {
      expanded[file.path] = file.result.errors.length > 0;
    }
  },
  { immediate: true },
);

const fileCount = computed(() => props.result?.files.length ?? 0);
const totalErrors = computed(() => props.result?.totalErrors ?? 0);
const totalWarnings = computed(() => props.result?.totalWarnings ?? 0);

function toggle(path: string): void {
  expanded[path] = !expanded[path];
}

function closePanel(): void {
  emit("close");
}

function openFile(path: string): void {
  emit("openFile", path);
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end bg-black/30"
      @click.self="closePanel"
    >
      <section
        class="w-full max-h-[60vh] overflow-hidden border-t border-border bg-background shadow-xl"
      >
        <header
          class="flex items-center justify-between px-4 py-2 border-b border-border"
        >
          <h3 class="text-sm font-semibold">Validation Results</h3>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            @click="closePanel"
          >
            <X class="size-4" />
          </Button>
        </header>

        <div
          class="px-4 py-2 border-b border-border text-xs text-muted-foreground flex items-center gap-3"
        >
          <span
            class="inline-flex items-center gap-1"
            :class="props.result?.valid ? 'text-green-600' : 'text-destructive'"
          >
            <CheckCircle2 v-if="props.result?.valid" class="size-3.5" />
            <AlertCircle v-else class="size-3.5" />
            {{ fileCount }} files
          </span>
          <span>{{ totalErrors }} errors</span>
          <span>{{ totalWarnings }} warnings</span>
        </div>

        <div class="max-h-[calc(60vh-84px)] overflow-y-auto">
          <div
            v-if="isValidating"
            class="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground"
          >
            <span class="inline-block animate-spin">⟳</span>
            <span>Validating workspace...</span>
          </div>

          <Alert v-else-if="error" variant="destructive" class="m-4">
            <AlertTitle>Validation failed</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <div v-else-if="props.result" class="divide-y divide-border">
            <article
              v-for="file in props.result.files"
              :key="file.path"
              class="px-4 py-2"
            >
              <button
                type="button"
                class="w-full flex items-center justify-between gap-3 text-left"
                @click="toggle(file.path)"
              >
                <span class="flex items-center gap-2 min-w-0">
                  <AlertCircle
                    v-if="file.result.errors.length"
                    class="size-3.5 text-destructive shrink-0"
                  />
                  <AlertTriangle
                    v-else-if="file.result.warnings.length"
                    class="size-3.5 text-yellow-500 shrink-0"
                  />
                  <CheckCircle2
                    v-else
                    class="size-3.5 text-green-600 shrink-0"
                  />
                  <span class="truncate text-xs">{{ file.path }}</span>
                </span>
                <span
                  class="flex items-center gap-2 shrink-0 text-[11px] text-muted-foreground"
                >
                  <span>{{ file.result.errors.length }} errors</span>
                  <span>{{ file.result.warnings.length }} warnings</span>
                  <ChevronDown v-if="expanded[file.path]" class="size-3.5" />
                  <ChevronRight v-else class="size-3.5" />
                </span>
              </button>

              <div v-if="expanded[file.path]" class="mt-2 space-y-1 pl-6">
                <button
                  v-for="(diag, idx) in [
                    ...file.result.errors,
                    ...file.result.warnings,
                  ]"
                  :key="`${file.path}-${idx}`"
                  type="button"
                  class="block w-full rounded px-2 py-1 text-left text-xs hover:bg-muted"
                  @click="openFile(file.path)"
                >
                  <span class="font-medium">line {{ diag.line }}:</span>
                  <span>{{ diag.message }}</span>
                </button>
                <p
                  v-if="
                    file.result.errors.length === 0 &&
                    file.result.warnings.length === 0
                  "
                  class="text-xs text-muted-foreground"
                >
                  No issues.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>
