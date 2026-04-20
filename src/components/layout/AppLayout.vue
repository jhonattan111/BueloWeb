<template>
  <div
    class="h-screen overflow-hidden bg-background text-foreground flex flex-col"
  >
    <!-- Header bar -->
    <header
      class="h-10 flex items-center justify-between border-b border-border px-3 shrink-0"
    >
      <span
        class="text-xs font-semibold tracking-widest uppercase text-muted-foreground"
        >Buelo</span
      >
      <span class="text-xs text-muted-foreground">Report Studio</span>
    </header>

    <!-- 3-column resizable layout -->
    <div
      ref="layoutRef"
      class="flex-1 overflow-hidden min-h-0 relative"
      :style="desktopLayoutStyle"
    >
      <aside class="hidden lg:flex flex-col min-h-0 border-r border-border">
        <slot name="sidebar-left" />
      </aside>

      <div
        class="hidden lg:block w-1 cursor-col-resize bg-transparent hover:bg-border/80 transition-colors"
        @mousedown.prevent="startDrag('left', $event)"
      />

      <main class="hidden lg:flex flex-col min-h-0 overflow-hidden">
        <slot name="editor" />
      </main>

      <div
        class="hidden lg:block w-1 cursor-col-resize bg-transparent hover:bg-border/80 transition-colors"
        @mousedown.prevent="startDrag('right', $event)"
      />

      <aside class="hidden lg:flex flex-col min-h-0 border-l border-border">
        <slot name="sidebar-right" />
      </aside>

      <main
        class="lg:hidden flex flex-col min-h-0 overflow-hidden absolute inset-0"
      >
        <slot name="editor" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type DragTarget = "left" | "right";

const layoutRef = ref<HTMLElement | null>(null);
const leftWidth = ref(300);
const rightWidth = ref(420);

const MIN_LEFT = 220;
const MIN_RIGHT = 300;
const MIN_EDITOR = 420;

const desktopLayoutStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `${leftWidth.value}px 4px minmax(${MIN_EDITOR}px, 1fr) 4px ${rightWidth.value}px`,
}));

function startDrag(target: DragTarget, downEvent: MouseEvent) {
  const layoutEl = layoutRef.value;
  if (!layoutEl) return;

  const rect = layoutEl.getBoundingClientRect();

  const onMove = (moveEvent: MouseEvent) => {
    const x = moveEvent.clientX - rect.left;

    if (target === "left") {
      const maxLeft = rect.width - rightWidth.value - MIN_EDITOR - 8;
      leftWidth.value = clamp(x, MIN_LEFT, maxLeft);
      return;
    }

    const proposedRight = rect.width - x;
    const maxRight = rect.width - leftWidth.value - MIN_EDITOR - 8;
    rightWidth.value = clamp(proposedRight, MIN_RIGHT, maxRight);
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  downEvent.preventDefault();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
</script>
