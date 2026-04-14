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

        <Button size="sm" :disabled="store.isRendering" @click="onRender">
          <span v-if="store.isRendering">Rendering…</span>
          <span v-else>Render</span>
        </Button>
      </div>

      <!-- Template editor -->
      <TabsContent value="template" class="flex-1 min-h-0 mt-0">
        <TemplateEditor v-model="templateCodeModel" class="h-full" />
      </TabsContent>

      <!-- JSON editor -->
      <TabsContent value="data" class="flex-1 min-h-0 mt-0">
        <JsonEditor v-model="jsonDataModel" class="h-full" />
      </TabsContent>
    </Tabs>

    <!-- Inline error -->
    <p
      v-if="store.renderError"
      class="px-3 py-1.5 text-xs text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ store.renderError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useReportStore } from "@/stores/reportStore";
import TemplateEditor from "./TemplateEditor.vue";
import JsonEditor from "./JsonEditor.vue";

const store = useReportStore();

const activeTab = ref<"template" | "data">("template");

const templateCodeModel = defineModel<string>("templateCode", { default: "" });
const jsonDataModel = defineModel<string>("jsonData", { default: "" });

function onRender() {
  store.render(templateCodeModel.value, jsonDataModel.value);
}
</script>
