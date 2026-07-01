<template>
  <div class="flex flex-col h-full min-h-0 bg-muted/30">
    <div class="flex items-start gap-2 px-2 py-1 shrink-0 border-b border-border">
      <!-- Tab strip wraps onto new rows (VS-style) instead of scrolling horizontally. -->
      <div class="flex flex-wrap items-center gap-1 flex-1 min-w-0 max-h-32 overflow-y-auto">
        <div
          v-for="path in openPaths"
          :key="path"
          draggable="true"
          class="group inline-flex items-center rounded border text-xs transition-opacity"
          :class="[
            activeFilePath === path
              ? 'bg-accent text-accent-foreground border-border'
              : 'bg-background/60 text-muted-foreground border-transparent hover:bg-muted',
            dragOverPath === path && draggingPath !== path ? 'ring-1 ring-primary' : '',
            draggingPath === path ? 'opacity-50' : '',
          ]"
          @mousedown.middle.prevent="requestClose(path)"
          @dragstart="onDragStart(path, $event)"
          @dragover.prevent="onDragOver(path)"
          @dragleave="onDragLeave(path)"
          @drop.prevent="onDrop(path)"
          @dragend="onDragEnd"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-2 py-1"
            @click="switchToFile(path)"
          >
            <span class="max-w-[26ch] truncate" :title="path">{{ fileName(path) }}</span>
            <span
              v-if="isDirty(path)"
              class="inline-block size-1.5 rounded-full bg-amber-500"
              title="Unsaved"
            />
          </button>
          <button
            type="button"
            class="opacity-0 group-hover:opacity-100 rounded p-0.5 mr-1 hover:bg-muted-foreground/20"
            @click.stop="requestClose(path)"
          >
            ×
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <!-- Open-editors overflow menu (VS-style): jump to any tab, Save all. -->
        <div v-if="openPaths.length" ref="overflowMenuRef" class="relative">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded size-6 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Open editors"
            @click="overflowOpen = !overflowOpen"
          >
            <ChevronDown class="size-4" />
          </button>

          <div
            v-if="overflowOpen"
            class="absolute right-0 top-7 z-20 w-64 rounded-md border border-border bg-popover text-popover-foreground shadow-md py-1 text-xs"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
              :disabled="!hasUnsaved"
              @click="onSaveAll"
            >
              <span>Save all</span>
              <span class="text-[10px] text-muted-foreground">Ctrl+K S</span>
            </button>
            <div class="my-1 border-t border-border" />
            <div class="max-h-64 overflow-y-auto">
              <button
                v-for="path in openPaths"
                :key="path"
                type="button"
                class="flex w-full items-center gap-1.5 px-3 py-1.5 text-left hover:bg-muted"
                :class="
                  activeFilePath === path ? 'text-foreground font-medium' : 'text-muted-foreground'
                "
                @click="onOverflowSelect(path)"
              >
                <span
                  class="inline-block size-1.5 shrink-0 rounded-full"
                  :class="isDirty(path) ? 'bg-amber-500' : 'bg-transparent'"
                />
                <span class="truncate" :title="path">{{ fileName(path) }}</span>
              </button>
            </div>
          </div>
        </div>

        <span
          v-if="diagnosticState === 'validating'"
          class="text-muted-foreground text-xs animate-spin inline-block"
          title="Validating..."
          >⟳</span
        >
        <span
          v-else-if="diagnosticState === 'error'"
          class="text-destructive text-xs"
          :title="projectValidationError || 'Validation errors'"
          >✕</span
        >
        <span
          v-else-if="diagnosticState === 'ok'"
          class="text-xs"
          style="color: #4ade80"
          title="No errors"
          >✓</span
        >
        <span v-else class="text-muted-foreground text-xs" title="Not validated">-</span>

        <Button
          size="sm"
          variant="ghost"
          :disabled="isProjectValidating"
          class="shrink-0 text-xs px-2 h-6"
          @click="runProjectValidation"
        >
          <span v-if="isProjectValidating">Validating...</span>
          <span v-else>Validate Project</span>
        </Button>

        <Button
          size="sm"
          :disabled="reportStore.isRendering || !canRenderActive"
          class="shrink-0"
          :title="
            canRenderActive
              ? 'Render active file'
              : 'Render is available for .cs and *.report.yml tabs'
          "
          @click="onRender"
        >
          <span v-if="reportStore.isRendering">Rendering...</span>
          <span v-else>Render</span>
        </Button>
      </div>
    </div>

    <div class="flex-1 min-h-0 relative">
      <div
        v-if="!activeFile"
        class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
      >
        Open a file from the tree to start editing.
      </div>

      <div v-else-if="activeExtension === '.cs'" class="absolute inset-0">
        <TemplateEditor ref="templateEditorRef" v-model="templateCodeModel" class="h-full" />
      </div>

      <div v-else-if="activeExtension === '.json'" class="absolute inset-0">
        <JsonEditor v-model="jsonDataModel" class="h-full" />
      </div>

      <div v-else-if="activeArtefact" class="absolute inset-0">
        <ArtefactEditorTab
          :key="activeArtefact.path ?? activeArtefact.name"
          :artefact="activeArtefact"
          @change="onArtefactChange"
          @validation-result="onArtefactValidationResult"
        />
      </div>
    </div>

    <p
      v-if="reportStore.renderError"
      class="px-3 py-1.5 text-xs text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ reportStore.renderError }}
    </p>

    <p
      v-if="validationError"
      class="px-3 py-1.5 text-xs text-destructive border-t border-border bg-destructive/5 shrink-0"
    >
      {{ validationError }}
    </p>

    <AlertDialog
      :open="pendingClose !== null"
      @update:open="
        (v) => {
          if (!v) pendingClose = null
        }
      "
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            "{{ pendingClose ? fileName(pendingClose) : '' }}" has unsaved changes. Save before
            closing?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" @click="confirmCloseDiscard"> Don't save </Button>
          <Button @click="confirmCloseSave">Save</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import TemplateEditor from './TemplateEditor.vue'
import JsonEditor from './JsonEditor.vue'
import ArtefactEditorTab from './ArtefactEditorTab.vue'
import { useReportStore } from '@/stores/reportStore'
import { useActiveTemplate } from '@/composables/useActiveTemplate'
import { useTemplateDiagnostics } from '@/composables/useTemplateDiagnostics'
import { useWorkspaceTree } from '@/composables/useWorkspaceTree'
import {
  PROJECT_VALIDATION_KEY,
  type UseProjectValidation,
} from '@/composables/useProjectValidation'
import type {
  FileValidationResult,
  TemplateArtefact,
  TemplateFile,
  TemplateFileKind,
} from '@/types/template'
import { useReportSettings } from '@/composables/useReportSettings'
import { getFile } from '@/services/workspaceService'

const templateCodeModel = defineModel<string>('templateCode', { default: '' })
const jsonDataModel = defineModel<string>('jsonData', { default: '' })

const reportStore = useReportStore()
const { settings: reportSettings } = useReportSettings()
const {
  files,
  activeFile,
  activeFilePath,
  openPaths,
  hasUnsaved,
  saveFile,
  saveAllFiles,
  setFileContent,
  switchToFile,
  reorderTabs,
  closeFile,
  isDirty,
  getFile: getOpenFile,
} = useActiveTemplate()
const { setValidationResult } = useWorkspaceTree()
const projectValidation = inject<UseProjectValidation | null>(PROJECT_VALIDATION_KEY, null)

const templateEditorRef = ref<InstanceType<typeof TemplateEditor> | null>(null)

const activeExtension = computed(() => extensionOf(activeFile.value?.path ?? ''))
const canRenderActive = computed(
  () => activeExtension.value === '.cs' || isReportYaml(activeFile.value?.path),
)

const isProjectValidating = computed(() => projectValidation?.isValidating.value ?? false)
const projectValidationError = computed(() => projectValidation?.error.value ?? null)
const projectValidationResult = computed(() => projectValidation?.result.value ?? null)

const diagnosticState = computed(() => {
  if (isProjectValidating.value) return 'validating'
  if (projectValidationError.value) return 'error'
  if (!projectValidationResult.value) return 'idle'
  if (!projectValidationResult.value.valid) return 'error'
  return 'ok'
})

watch(
  () => activeFile.value,
  (file) => {
    if (!file) return
    const ext = extensionOf(file.path)
    if (ext === '.cs') {
      templateCodeModel.value = file.content
    }
    if (ext === '.json') {
      jsonDataModel.value = file.content
    }
  },
  { immediate: true },
)

// Push live editor content into the open-file state (drives the dirty indicator and lets
// Render use unsaved edits). Persisting is explicit — Ctrl+S, handled at the page level.
watch(templateCodeModel, (value) => {
  const path = activeFile.value?.path
  if (!path || extensionOf(path) !== '.cs') return
  setFileContent(path, value)
})

watch(jsonDataModel, (value) => {
  const path = activeFile.value?.path
  if (!path || extensionOf(path) !== '.json') return
  setFileContent(path, value)
})

const { validationError } = useTemplateDiagnostics(
  () => templateCodeModel.value,
  () => 'FullClass',
  () => templateEditorRef.value?.getModel() ?? null,
  () => activeFile.value?.path ?? '',
)

const activeArtefact = computed(() => {
  if (!activeFile.value) return null
  if (activeExtension.value === '.cs' || activeExtension.value === '.json') return null
  return toArtefact(activeFile.value)
})

async function runProjectValidation(): Promise<void> {
  if (!projectValidation) return
  await projectValidation.runValidation()
}

async function onRender(): Promise<void> {
  if (!activeFile.value || !canRenderActive.value) return

  const source = activeFile.value.content

  // Use data from dataSourcePath if configured, otherwise use empty object.
  // Check open editors first (picks up unsaved edits), then fall back to the API.
  let jsonData = '{}'
  const dataPath = reportSettings.value.dataSourcePath?.trim()
  if (dataPath) {
    const dataFile = files.value.find((f) => f.path === dataPath)
    if (dataFile) {
      jsonData = dataFile.content
    } else {
      try {
        const fetched = await getFile(dataPath)
        if (fetched) jsonData = fetched.content
      } catch {
        // ignore fetch error — render will proceed with empty data
      }
    }
  }

  if (isReportYaml(activeFile.value.path)) {
    const baseName = fileName(activeFile.value.path).replace(/\.report\.ya?ml$/i, '')
    await reportStore.renderDeclarativeWithSettings(
      source,
      jsonData,
      reportSettings.value,
      baseName,
    )
    return
  }

  const baseName = fileName(activeFile.value.path).replace(/\.cs$/i, '')
  await reportStore.renderWithSettings(source, jsonData, reportSettings.value, baseName)
}

function onArtefactChange(content: string): void {
  const path = activeFile.value?.path
  if (!path) return
  setFileContent(path, content)
}

// ── Close with unsaved-changes guard ──────────────────────────────────────────
const pendingClose = ref<string | null>(null)

function requestClose(path: string): void {
  if (isDirty(path)) {
    pendingClose.value = path
  } else {
    closeFile(path)
  }
}

async function confirmCloseSave(): Promise<void> {
  const path = pendingClose.value
  if (!path) return
  const file = getOpenFile(path)
  if (file) {
    await saveFile({ path, content: file.content, kind: inferFileKind(path) })
  }
  closeFile(path)
  pendingClose.value = null
}

function confirmCloseDiscard(): void {
  const path = pendingClose.value
  if (!path) return
  closeFile(path)
  pendingClose.value = null
}

// ── Drag-to-reorder tabs ──────────────────────────────────────────────────────
const draggingPath = ref<string | null>(null)
const dragOverPath = ref<string | null>(null)

function onDragStart(path: string, event: DragEvent): void {
  draggingPath.value = path
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    // Firefox requires data to be set for the drag to initiate.
    event.dataTransfer.setData('text/plain', path)
  }
}

function onDragOver(path: string): void {
  if (draggingPath.value && draggingPath.value !== path) {
    dragOverPath.value = path
  }
}

function onDragLeave(path: string): void {
  if (dragOverPath.value === path) dragOverPath.value = null
}

function onDrop(path: string): void {
  if (draggingPath.value && draggingPath.value !== path) {
    reorderTabs(draggingPath.value, path)
  }
  onDragEnd()
}

function onDragEnd(): void {
  draggingPath.value = null
  dragOverPath.value = null
}

// ── Open-editors overflow menu ────────────────────────────────────────────────
const overflowOpen = ref(false)
const overflowMenuRef = ref<HTMLElement | null>(null)
onClickOutside(overflowMenuRef, () => {
  overflowOpen.value = false
})

function onOverflowSelect(path: string): void {
  switchToFile(path)
  overflowOpen.value = false
}

async function onSaveAll(): Promise<void> {
  overflowOpen.value = false
  await saveAllFiles()
}

function onArtefactValidationResult(fileId: string, result: FileValidationResult): void {
  setValidationResult(fileId, result)
}

function toArtefact(file: TemplateFile): TemplateArtefact {
  const name = fileName(file.path)
  const dotIndex = name.lastIndexOf('.')
  return {
    path: file.path,
    name: dotIndex >= 0 ? name.slice(0, dotIndex) : name,
    extension: dotIndex >= 0 ? name.slice(dotIndex) : '',
    content: file.content,
  }
}

function inferFileKind(path: string): TemplateFileKind {
  const ext = extensionOf(path)
  if (ext === '.json') return 'data'
  if (ext === '.cs' || ext === '.csx') return 'helper'
  return 'file'
}

function extensionOf(path: string): string {
  const name = fileName(path).toLowerCase()
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index) : ''
}

function isReportYaml(path: string | undefined): boolean {
  if (!path) return false
  const name = fileName(path).toLowerCase()
  return name.endsWith('.report.yml') || name.endsWith('.report.yaml')
}

function fileName(path: string): string {
  return path.split('/').at(-1) ?? path
}
</script>
