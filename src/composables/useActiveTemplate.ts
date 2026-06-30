import { computed, ref } from 'vue'
import * as workspaceService from '@/services/workspaceService'
import type { TemplateFile, TemplateFileKind } from '@/types/template'
import { useOpenEditors } from '@/composables/useOpenEditors'

const filesState = ref<TemplateFile[]>([])
// Last-saved (baseline) content per open path. A file is "dirty" when its live editor
// content differs from this baseline — derived, never set by hand, so it can't drift.
const savedContentState = ref<Record<string, string>>({})
const isLoadingState = ref(false)

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').trim()
}

function setBaseline(path: string, content: string): void {
  savedContentState.value = { ...savedContentState.value, [path]: content }
}

function clearBaseline(path: string): void {
  const next = { ...savedContentState.value }
  delete next[path]
  savedContentState.value = next
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

  /** A file has unsaved edits when its live content differs from the saved baseline. */
  function isDirty(path: string): boolean {
    const normalizedPath = normalizePath(path)
    const file = filesState.value.find((entry) => entry.path === normalizedPath)
    if (!file) return false
    const baseline = savedContentState.value[normalizedPath]
    return baseline !== undefined && file.content !== baseline
  }

  const hasUnsaved = computed(() => editors.openPaths.value.some((p) => isDirty(p)))

  async function openFile(path: string): Promise<void> {
    const normalizedPath = normalizePath(path)
    if (!normalizedPath) return

    isLoadingState.value = true
    try {
      const loaded = await workspaceService.getFile(normalizedPath)
      const resolved = normalizePath(loaded.path)
      upsertOpenFile({
        path: resolved,
        kind: inferKindFromExtension(loaded.path),
        content: loaded.content,
      })
      setBaseline(resolved, loaded.content)
      editors.open(resolved)
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
    const resolved = normalizePath(saved.path)
    upsertOpenFile({
      path: resolved,
      kind: payload.kind ?? inferKindFromExtension(saved.path),
      content: saved.content,
    })
    setBaseline(resolved, saved.content)
  }

  /** Saves the active file if it has unsaved edits. No-op otherwise. */
  async function saveActiveFile(): Promise<void> {
    const file = activeFile.value
    if (!file || !isDirty(file.path)) return
    await saveFile({ path: file.path, content: file.content })
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
    clearBaseline(normalizedPath)
    editors.close(normalizedPath)
  }

  /** Closes a tab and drops its state (any unsaved edits are discarded — confirm before calling). */
  function closeFile(path: string): void {
    const normalizedPath = normalizePath(path)
    editors.close(normalizedPath)
    clearBaseline(normalizedPath)
    filesState.value = filesState.value.filter((entry) => entry.path !== normalizedPath)
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
    hasUnsaved,
    openFile,
    saveFile,
    saveActiveFile,
    loadFiles,
    removeFile,
    setFileContent,
    getFile,
    switchToFile: editors.switchTo,
    closeFile,
    isDirty,
  }
}
