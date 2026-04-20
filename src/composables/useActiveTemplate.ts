import { ref, watch } from 'vue'
import { useTemplateStore } from '@/stores/templateStore'
import * as templateService from '@/services/templateService'
import * as workspaceService from '@/services/workspaceService'
import type { Template, TemplateArtefact, TemplateFile, TemplateFileKind, TemplateMode } from '@/types/template'

export const GLOBAL_ARTEFACT_PATH_PREFIX = '_global/'
const DEFAULT_DATA_FILE_PATH = 'data/mock.data.json'

const filesState = ref<TemplateFile[]>([])
const activeFilePathState = ref<string>('')
const isLoadingState = ref(false)
let watcherInitialized = false

export function useActiveTemplate() {
  const templateStore = useTemplateStore()

  const files = filesState
  const activeFilePath = activeFilePathState
  const isLoading = isLoadingState

  async function loadFiles(): Promise<void> {
    const id = templateStore.activeTemplateId
    const activeTemplate = templateStore.activeTemplate
    if (!id) {
      files.value = []
      activeFilePath.value = ''
      return
    }
    isLoading.value = true
    try {
      const fetchedFiles = await templateService.listFiles(id)
      if (activeTemplate) {
        files.value = hydrateFiles(activeTemplate, fetchedFiles)
        const rootPath = getTemplateRootPath(activeTemplate.name)
        const hasActivePath = files.value.some((f) => f.path === activeFilePath.value)
        const isGlobalPath = activeFilePath.value.startsWith(GLOBAL_ARTEFACT_PATH_PREFIX)
        if (!activeFilePath.value || (!hasActivePath && !isGlobalPath)) {
          activeFilePath.value = rootPath
        }
      } else {
        files.value = fetchedFiles
      }
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
        const activeTemplate = templateStore.activeTemplate
        if (activeTemplate) {
          files.value = hydrateFiles(activeTemplate)
          activeFilePath.value = getTemplateRootPath(activeTemplate.name)
        } else {
          files.value = []
          activeFilePath.value = ''
        }

        if (id) loadFiles()
      },
      { immediate: true },
    )

    watch(
      () => templateStore.activeTemplate?.name,
      (name, previousName) => {
        if (!name || !previousName) return

        const nextRootPath = getTemplateRootPath(name)
        const prevRootPath = getTemplateRootPath(previousName)
        if (activeFilePath.value === prevRootPath) {
          activeFilePath.value = nextRootPath
        }
      },
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
    const activeTemplate = templateStore.activeTemplate
    if (!id) return

    const saved = await templateService.upsertFile(id, payload)
    const idx = files.value.findIndex((f) => f.path === saved.path)
    if (idx !== -1) {
      files.value[idx] = saved
    } else {
      files.value.push(saved)
    }

    if (activeTemplate && saved.path === getTemplateRootPath(activeTemplate.name)) {
      await templateStore.updateTemplate(id, {
        template: saved.content,
      })
    }
  }

  async function removeFile(path: string): Promise<void> {
    const id = templateStore.activeTemplateId
    if (!id) return

    await templateService.deleteFile(id, path)
    files.value = files.value.filter((f) => f.path !== path)
    if (activeFilePath.value === path) {
      const activeTemplate = templateStore.activeTemplate
      activeFilePath.value = activeTemplate ? getTemplateRootPath(activeTemplate.name) : ''
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
  templateName: string,
  templateSource: string,
  mockData: object,
  artefacts: TemplateArtefact[],
): TemplateFile[] {
  const templatePath = getTemplateRootPath(templateName)

  const seeded: TemplateFile[] = [
    {
      path: templatePath,
      kind: 'file',
      content: templateSource,
    },
    {
      path: DEFAULT_DATA_FILE_PATH,
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
  if (path.endsWith('.data.json')) return 'data'
  return 'file'
}

function hydrateFiles(activeTemplate: Template, fetchedFiles: TemplateFile[] = []): TemplateFile[] {
  const seeded = seedFilesFromTemplate(
    activeTemplate.name,
    activeTemplate.template,
    activeTemplate.mockData,
    activeTemplate.artefacts,
  )

  const byPath = new Map<string, TemplateFile>()
  for (const file of seeded) {
    byPath.set(file.path, file)
  }
  for (const file of fetchedFiles) {
    byPath.set(file.path, file)
  }

  return Array.from(byPath.values())
}

function getTemplateRootPath(templateName: string): string {
  return templateName.endsWith('.buelo') ? templateName : `${templateName}.buelo`
}
