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
      <Button variant="ghost" size="icon-sm" aria-label="New template">
        <Plus class="size-4" />
      </Button>
    </div>

    <!-- List -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="p-2 flex flex-col gap-0.5">
        <p class="px-2 py-1.5 text-xs text-muted-foreground">
          No templates yet.
        </p>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
</script>
