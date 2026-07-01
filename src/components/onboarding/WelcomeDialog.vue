<script setup lang="ts">
import {
  Sparkles,
  Table2,
  Users,
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  FileCode,
  Braces,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

defineProps<{ open: boolean; isCreating?: boolean; error?: string | null }>()

const emit = defineEmits<{
  create: []
  dismiss: []
}>()

const items = [
  {
    icon: Table2,
    title: 'invoice.report.yml',
    desc: 'Declarative invoice — items table with an aggregated total and currency/tax-id formatting.',
  },
  {
    icon: Users,
    title: 'employees.report.yml',
    desc: 'Grouped by department with per-group subtotals (groupBy + sum).',
  },
  {
    icon: LayoutDashboard,
    title: 'dashboard.report.yml',
    desc: 'KPI cards in a row, plus markdown — showcases card / row / panel.',
  },
  {
    icon: FileSpreadsheet,
    title: 'sales.report.yml',
    desc: 'Tabular report exported to Excel (.xlsx) — output format preset to Excel.',
  },
  {
    icon: Layers,
    title: 'statement.report.yml',
    desc: 'Imports an external layout (letterhead.component.yml) via import / use / with.',
  },
  {
    icon: FileCode,
    title: 'letter.cs',
    desc: 'C# report (QuestPDF) — the full-power path.',
  },
  {
    icon: Braces,
    title: 'data + script',
    desc: 'JSON data for each report and a helper script (.csx).',
  },
]
</script>

<template>
  <Dialog
    :open="open"
    @update:open="
      (v: boolean) => {
        if (!v) emit('dismiss')
      }
    "
  >
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Sparkles class="size-4 text-primary" />
          Welcome to Buelo
        </DialogTitle>
        <DialogDescription>
          Want to start with a few example reports? They show off the product's features and already
          render — just open one and click Render.
        </DialogDescription>
      </DialogHeader>

      <div class="py-1">
        <p class="text-xs text-muted-foreground mb-2">
          They'll be created in the <code>examples/</code> folder:
        </p>
        <ul class="space-y-2.5">
          <li v-for="item in items" :key="item.title" class="flex items-start gap-2.5">
            <component :is="item.icon" class="size-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div class="min-w-0">
              <p class="text-sm font-medium leading-tight">{{ item.title }}</p>
              <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
            </div>
          </li>
        </ul>
      </div>

      <p v-if="error" class="text-xs text-destructive">{{ error }}</p>

      <DialogFooter>
        <Button variant="outline" :disabled="isCreating" @click="emit('dismiss')"> Not now </Button>
        <Button :disabled="isCreating" @click="emit('create')">
          {{ isCreating ? 'Creating…' : 'Create examples' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
