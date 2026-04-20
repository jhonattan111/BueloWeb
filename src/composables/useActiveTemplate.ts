import { computed, ref } from 'vue'
import * as workspaceService from '@/services/workspaceService'
import type { TemplateFile, TemplateFileKind } from '@/types/template'
import { useOpenEditors } from '@/composables/useOpenEditors'

const filesState = ref<TemplateFile[]>([])
const isLoadingState = ref(false)

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').trim()
}

function inferKindFromExtension(path: string): TemplateFileKind {
  const lower = path.toLowerCase()
  if (lower.endsWith('.json')) return 'data'
  if (lower.endsWith('.cs') || lower.endsWith('.csx')) return 'helper'
  return 'file'
}

function upsertOpenFile(file: TemplateFile): void {
  const idx = filesState.value.findIndex((entry) => entry.path === file.path)
  if (idx === -1) {
    filesState.value = [...filesState.value, file]
    return
  }
  const next = [...filesState.value]
  next[idx] = file
  filesState.value = next
}

export function useActiveTemplate() {
  const editors = useOpenEditors()

  const files = computed(() => filesState.value)
  const activeFilePath = editors.activePath
  const isLoading = computed(() => isLoadingState.value)

  const activeFile = computed(() =>
    filesState.value.find((entry) => entry.path === activeFilePath.value) ?? null,
  )

  async function openFile(path: string): Promise<void> {
    const normalizedPath = normalizePath(path)
    if (!normalizedPath) return

    isLoadingState.value = true
    try {
      const loaded = await workspaceService.getFile(normalizedPath)
      upsertOpenFile({
        path: normalizePath(loaded.path),
        kind: inferKindFromExtension(loaded.path),
        content: loaded.content,
      })
      editors.open(normalizedPath)
      editors.markDirty(normalizedPath, false)
    } finally {
      isLoadingState.value = false
    }
  }

  async function saveFile(payload: {
    path: string
    content: string
    kind?: TemplateFileKind
  }): Promise<void> {
    const normalizedPath = normalizePath(payload.path)
    const saved = await workspaceService.saveFile(normalizedPath, payload.content, true)
    upsertOpenFile({
      path: normalizePath(saved.path),
      kind: payload.kind ?? inferKindFromExtension(saved.path),
      content: saved.content,
    })
    editors.markDirty(normalizedPath, false)
  }

  async function loadFiles(paths?: string[]): Promise<void> {
    if (!paths?.length) return
    for (const path of paths) {
      await openFile(path)
    }
  }

  async function removeFile(path: string): Promise<void> {
    const normalizedPath = normalizePath(path)
    await workspaceService.deleteNode(normalizedPath)
    filesState.value = filesState.value.filter((entry) => entry.path !== normalizedPath)
    editors.close(normalizedPath)
  }

  function setFileContent(path: string, content: string): void {
    const normalizedPath = normalizePath(path)
    const idx = filesState.value.findIndex((entry) => entry.path === normalizedPath)
    if (idx === -1) return

    const existing = filesState.value[idx]
    if (existing.content === content) return

    const next = [...filesState.value]
    next[idx] = { ...existing, content }
    filesState.value = next
    editors.markDirty(normalizedPath, true)
  }

  function getFile(path: string): TemplateFile | null {
    const normalizedPath = normalizePath(path)
    return filesState.value.find((entry) => entry.path === normalizedPath) ?? null
  }

  return {
    files,
    activeFile,
    activeFilePath,
    isLoading,
    openPaths: editors.openPaths,
    dirtyMap: editors.dirtyMap,
    openFile,
    saveFile,
    loadFiles,
    removeFile,
    setFileContent,
    getFile,
    switchToFile: editors.switchTo,
    closeFile: editors.close,
    markDirty: editors.markDirty,
    isDirty: editors.isDirty,
  }
}
