<template>
  <div class="flex flex-col h-full min-h-0 bg-muted/30">
    <Tabs v-model="activeTab" class="flex flex-col flex-1 min-h-0">
      <!-- Tab bar -->
      <div
        class="flex items-center justify-between px-3 h-10 shrink-0 border-b border-border"
      >
        <TabsList class="h-7 bg-transparent p-0 gap-1">
          <TabsTrigger value="template" class="text-xs px-2 h-6"
            >Template</TabsTrigger
          >
          <TabsTrigger value="data" class="text-xs px-2 h-6"
            >Data (JSON)</TabsTrigger
          >
        </TabsList>

        <Button size="sm" @click="onRender">Render</Button>
      </div>

      <!-- Template editor -->
      <TabsContent value="template" class="flex-1 min-h-0 mt-0">
        <TemplateEditor v-model="templateCode" class="h-full" />
      </TabsContent>

      <!-- JSON editor -->
      <TabsContent value="data" class="flex-1 min-h-0 mt-0">
        <JsonEditor v-model="jsonData" class="h-full" />
      </TabsContent>
    </Tabs>

    <!-- Inline error -->
    <p
      v-if="renderError"
      class="px-3 py-1.5 text-xs text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ renderError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TemplateEditor from "./TemplateEditor.vue";
import JsonEditor from "./JsonEditor.vue";

const emit = defineEmits<{
  render: [payload: { template: string; data: string }];
}>();

const activeTab = ref<"template" | "data">("template");
const templateCode = ref<string>("");
const jsonData = ref<string>("");
const renderError = ref<string | null>(null);

function onRender() {
  renderError.value = null;
  try {
    JSON.parse(jsonData.value || "{}");
  } catch {
    renderError.value = "Invalid JSON in Data tab.";
    activeTab.value = "data";
    return;
  }
  emit("render", { template: templateCode.value, data: jsonData.value });
}
</script>
