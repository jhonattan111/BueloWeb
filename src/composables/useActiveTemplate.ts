import { ref, watch } from 'vue'
import { useTemplateStore } from '@/stores/templateStore'
import * as templateService from '@/services/templateService'
import type { TemplateArtefact, TemplateFile, TemplateFileKind, TemplateMode } from '@/types/template'

export function useActiveTemplate() {
  const templateStore = useTemplateStore()

  const files = ref<TemplateFile[]>([])
  const activeFilePath = ref<string | null>(null)
  const isLoading = ref(false)

  async function loadFiles(): Promise<void> {
    const id = templateStore.activeTemplateId
    if (!id) {
      files.value = []
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

  watch(
    () => templateStore.activeTemplateId,
    (id) => {
      activeFilePath.value = null

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

  async function saveFile(payload: {
    path: string
    content: string
    kind?: TemplateFileKind
    mode?: TemplateMode
  }): Promise<void> {
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
      activeFilePath.value = null
    }
  }

  return {
    files,
    activeFilePath,
    isLoading,
    loadFiles,
    saveFile,
    removeFile,
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
