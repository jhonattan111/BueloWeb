<template>
  <AppLayout>
    <template #sidebar-left>
      <SidebarTemplates />
    </template>

    <template #editor>
      <CodeEditorPanel />
    </template>

    <template #sidebar-right>
      <PreviewPanel />
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/components/layout/AppLayout.vue";
import SidebarTemplates from "@/components/layout/SidebarTemplates.vue";
import CodeEditorPanel from "@/components/editors/CodeEditorPanel.vue";
import PreviewPanel from "@/components/preview/PreviewPanel.vue";
</script>
