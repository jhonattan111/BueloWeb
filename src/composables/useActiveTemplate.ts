import { ref, watch } from 'vue'
import { useTemplateStore } from '@/stores/templateStore'
import * as templateService from '@/services/templateService'
import * as workspaceService from '@/services/workspaceService'
import type { TemplateArtefact, TemplateFile, TemplateFileKind, TemplateMode } from '@/types/template'

export const GLOBAL_ARTEFACT_PATH_PREFIX = '_global/'

const filesState = ref<TemplateFile[]>([])
const activeFilePathState = ref<string>('template.report.cs')
const isLoadingState = ref(false)
let watcherInitialized = false

export function useActiveTemplate() {
  const templateStore = useTemplateStore()

  const files = filesState
  const activeFilePath = activeFilePathState
  const isLoading = isLoadingState

  async function loadFiles(): Promise<void> {
    const id = templateStore.activeTemplateId
    if (!id) {
      files.value = []
      activeFilePath.value = 'template.report.cs'
      return
    }
    isLoading.value = true
    try {
      files.value = await templateService.listFiles(id)
    } catch {
      // Keep previously loaded files on error.
    } finally {
      isLoading.value = false
    }
  }

  if (!watcherInitialized) {
    watch(
      () => templateStore.activeTemplateId,
      (id) => {
        activeFilePath.value = 'template.report.cs'

        const activeTemplate = templateStore.activeTemplate
        if (activeTemplate) {
          files.value = seedFilesFromTemplate(activeTemplate.template, activeTemplate.mockData, activeTemplate.mode, activeTemplate.artefacts)
        } else {
          files.value = []
        }

        if (id) loadFiles()
      },
      { immediate: true },
    )

    watcherInitialized = true
  }

  async function saveFile(payload: {
    path: string
    content: string
    kind?: TemplateFileKind
    mode?: TemplateMode
  }): Promise<void> {
    // Global artefact virtual file: path is "_global/{id}{ext}"
    if (payload.path.startsWith(GLOBAL_ARTEFACT_PATH_PREFIX)) {
      const withoutPrefix = payload.path.slice(GLOBAL_ARTEFACT_PATH_PREFIX.length)
      // withoutPrefix = "{id}{ext}" e.g. "abc-123.json"
      const dotIdx = withoutPrefix.indexOf('.')
      const artefactId = dotIdx > 0 ? withoutPrefix.slice(0, dotIdx) : withoutPrefix
      await workspaceService.updateGlobalArtefact(artefactId, { content: payload.content })
      const idx = files.value.findIndex((f) => f.path === payload.path)
      if (idx !== -1) {
        files.value[idx] = { ...files.value[idx], content: payload.content }
      }
      return
    }

    const id = templateStore.activeTemplateId
    if (!id) return

    const saved = await templateService.upsertFile(id, payload)
    const idx = files.value.findIndex((f) => f.path === saved.path)
    if (idx !== -1) {
      files.value[idx] = saved
    } else {
      files.value.push(saved)
    }

    if (saved.path === 'template.report.cs') {
      await templateStore.updateTemplate(id, {
        template: saved.content,
        ...(saved.mode ? { mode: saved.mode } : {}),
      })
    }
  }

  async function removeFile(path: string): Promise<void> {
    const id = templateStore.activeTemplateId
    if (!id) return

    await templateService.deleteFile(id, path)
    files.value = files.value.filter((f) => f.path !== path)
    if (activeFilePath.value === path) {
      activeFilePath.value = 'template.report.cs'
    }
  }

  /**
   * Opens a global artefact for editing by injecting it as a virtual file
   * with path `_global/{id}{extension}`. This does NOT change the active template.
   */
  async function openGlobalArtefact(artefactId: string): Promise<void> {
    isLoading.value = true
    try {
      const artefact = await workspaceService.getGlobalArtefact(artefactId)
      const virtualPath = `${GLOBAL_ARTEFACT_PATH_PREFIX}${artefact.id}${artefact.extension}`

      const virtualFile: TemplateFile = {
        path: virtualPath,
        kind: 'file',
        content: artefact.content,
      }

      // Inject or replace in files list
      const idx = files.value.findIndex((f) => f.path === virtualPath)
      if (idx !== -1) {
        files.value[idx] = virtualFile
      } else {
        files.value.push(virtualFile)
      }

      activeFilePath.value = virtualPath
    } finally {
      isLoading.value = false
    }
  }

  return {
    files,
    activeFilePath,
    isLoading,
    loadFiles,
    saveFile,
    removeFile,
    openGlobalArtefact,
  }
}

function seedFilesFromTemplate(
  templateSource: string,
  mockData: object,
  mode: TemplateMode | undefined,
  artefacts: TemplateArtefact[],
): TemplateFile[] {
  const seeded: TemplateFile[] = [
    {
      path: 'template.report.cs',
      kind: 'template',
      mode: mode ?? 'Sections',
      content: templateSource,
    },
    {
      path: 'data/mock.data.json',
      kind: 'data',
      content: JSON.stringify(mockData ?? {}, null, 2),
    },
  ]

  for (const artefact of artefacts) {
    const path = artefact.path ?? `${artefact.name}${artefact.extension}`
    seeded.push({
      path,
      kind: inferKind(path),
      content: artefact.content,
    })
  }

  return seeded
}

function inferKind(path: string): TemplateFileKind {
  if (path.endsWith('.helpers.cs')) return 'helper'
  if (path.endsWith('.schema.json')) return 'schema'
  if (path.endsWith('.data.json')) return 'data'
  if (path.endsWith('.cs')) return 'template'
  return 'file'
}
