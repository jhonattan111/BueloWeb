<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { AlertDialogTitle } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <AlertDialogTitle
    :class="
      cn('text-sm font-semibold leading-none tracking-tight', props.class)
    "
  >
    <slot />
  </AlertDialogTitle>
</template>
