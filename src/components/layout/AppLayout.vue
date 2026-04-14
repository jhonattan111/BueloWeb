<template>
  <div
    class="h-screen overflow-hidden bg-background text-foreground flex flex-col"
  >
    <!-- Header bar -->
    <header class="h-10 flex items-center border-b border-border px-3 shrink-0">
      <span
        class="text-xs font-semibold tracking-widest uppercase text-muted-foreground"
        >Buelo</span
      >
    </header>

    <!-- 3-column grid -->
    <div
      class="flex-1 overflow-hidden grid lg:grid-cols-[260px_1fr_380px] grid-cols-1 min-h-0"
    >
      <aside class="hidden lg:flex flex-col min-h-0 border-r border-border">
        <slot name="sidebar-left" />
      </aside>

      <main class="flex flex-col min-h-0 overflow-hidden">
        <slot name="editor" />
      </main>

      <aside class="hidden lg:flex flex-col min-h-0 border-l border-border">
        <slot name="sidebar-right" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
