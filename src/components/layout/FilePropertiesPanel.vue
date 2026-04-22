<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useWorkspaceTree } from "@/composables/useWorkspaceTree";
import { getFile } from "@/services/workspaceService";
import { parseProjectBlock } from "@/composables/useReportSettings";

const { selectedNode } = useWorkspaceTree();
const lastModified = ref<string | null>(null);
const resolvedDataSource = ref<string | null>(null);

watch(
  () => selectedNode.value,
  async (node) => {
    lastModified.value = null;
    resolvedDataSource.value = null;

    if (!node || node.type !== "file") return;

    try {
      const file = await getFile(node.path);
      lastModified.value = file.lastModifiedUtc;

      if (node.extension.toLowerCase() === ".cs") {
        const parsed = parseProjectBlock(file.content);
        if (parsed.dataSourcePath) {
          resolvedDataSource.value = parsed.dataSourcePath;
          return;
        }

        const dataMatch = file.content.match(/^@data\s+from\s+"([^"]+)"/m);
        if (dataMatch?.[1]) {
          resolvedDataSource.value = dataMatch[1];
        }
      }
    } catch {
      lastModified.value = null;
      resolvedDataSource.value = null;
    }
  },
  { immediate: true },
);

const typeLabel = computed(() => {
  if (!selectedNode.value) return "-";
  if (selectedNode.value.type === "folder") return "folder";
  if (selectedNode.value.extension) return selectedNode.value.extension;
  return selectedNode.value.kind || "file";
});

const formattedLastModified = computed(() => {
  if (!lastModified.value) return "n/a";
  const parsed = new Date(lastModified.value);
  if (Number.isNaN(parsed.getTime())) return lastModified.value;
  return parsed.toLocaleString();
});
</script>

<template>
  <section class="flex h-full flex-col overflow-hidden bg-background/90">
    <header
      class="flex items-center justify-between px-3 h-9 shrink-0 border-b border-border"
    >
      <span
        class="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        Properties
      </span>
    </header>

    <div class="p-3 text-xs space-y-2 overflow-auto">
      <p v-if="!selectedNode" class="text-muted-foreground">
        Select a file or folder in Explorer.
      </p>

      <template v-else>
        <div>
          <p class="text-muted-foreground">Name</p>
          <p class="font-medium break-all">{{ selectedNode.name }}</p>
        </div>

        <div>
          <p class="text-muted-foreground">Type</p>
          <p class="font-medium">{{ typeLabel }}</p>
        </div>

        <div>
          <p class="text-muted-foreground">Path</p>
          <p class="font-medium break-all">{{ selectedNode.path }}</p>
        </div>

        <div>
          <p class="text-muted-foreground">Last Modified</p>
          <p class="font-medium">{{ formattedLastModified }}</p>
        </div>

        <div v-if="selectedNode.extension.toLowerCase() === '.cs'">
          <p class="text-muted-foreground">Resolved Data Source</p>
          <p class="font-medium break-all">
            {{ resolvedDataSource || "none" }}
          </p>
        </div>
      </template>
    </div>
  </section>
</template>
