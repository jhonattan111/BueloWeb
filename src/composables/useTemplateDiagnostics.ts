import { ref, watch, onUnmounted, type Ref, type MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as monaco from 'monaco-editor'
import * as templateService from '@/services/templateService'
import { listWorkspaceFilePaths } from '@/services/workspaceService'
import type { TemplateMode } from '@/types/template'

const ACTIVE_MODES: TemplateMode[] = ['FullClass']
const MARKER_OWNER = 'buelo'

export function useTemplateDiagnostics(
  templateSource: MaybeRefOrGetter<string>,
  mode: MaybeRefOrGetter<TemplateMode | string | number | null | undefined>,
  monacoModel: MaybeRefOrGetter<monaco.editor.ITextModel | null>,
  ownerPath?: MaybeRefOrGetter<string>,
): { isValidating: Ref<boolean>; hasErrors: Ref<boolean>; validationError: Ref<string | null>; validate: () => Promise<void> } {
  const isValidating = ref(false)
  const hasErrors = ref(false)
  const validationError = ref<string | null>(null)

  function clearMarkers() {
    const model = toValue(monacoModel)
    if (model) monaco.editor.setModelMarkers(model, MARKER_OWNER, [])
    hasErrors.value = false
  }

  async function validate(): Promise<void> {
    const source = toValue(templateSource)
    const m = normalizeMode(toValue(mode))
    const model = toValue(monacoModel)

    if (!m || !ACTIVE_MODES.includes(m)) {
      clearMarkers()
      validationError.value = null
      return
    }

    if (!model) return

    isValidating.value = true
    validationError.value = null
    try {
      const result = await templateService.validateTemplate(source, m)
      const importDiagnostics = await resolveImportDiagnostics(source, toValue(ownerPath))
      // Re-read model after async — it may have been disposed
      const currentModel = toValue(monacoModel)
      if (!currentModel) return

      const markers: monaco.editor.IMarkerData[] = [
        ...result.errors.map((e) => ({
          severity: monaco.MarkerSeverity.Error,
          message: e.message,
          startLineNumber: e.line,
          endLineNumber: e.line,
          startColumn: e.column,
          endColumn: e.column + 1,
        })),
        ...importDiagnostics.map((item) => ({
          severity: monaco.MarkerSeverity.Error,
          message: item.message,
          startLineNumber: item.line,
          endLineNumber: item.line,
          startColumn: item.column,
          endColumn: item.endColumn,
        })),
      ]
      monaco.editor.setModelMarkers(currentModel, MARKER_OWNER, markers)
      hasErrors.value = markers.length > 0
    } catch (e) {
      validationError.value = e instanceof Error ? e.message : 'Validation failed.'
    } finally {
      isValidating.value = false
    }
  }

  const debouncedValidate = useDebounceFn(validate, 1500)

  const stopWatch = watch(
    () => [toValue(templateSource), toValue(ownerPath)],
    () => debouncedValidate(),
  )

  onUnmounted(() => {
    stopWatch()
    clearMarkers()
  })

  return { isValidating, hasErrors, validationError, validate }
}

interface ImportDiagnostic {
  message: string
  line: number
  column: number
  endColumn: number
}

async function resolveImportDiagnostics(source: string, ownerPath?: string): Promise<ImportDiagnostic[]> {
  const workspaceFiles = new Set((await listWorkspaceFilePaths()).map(normalizePath))
  const diagnostics: ImportDiagnostic[] = []
  const lines = source.split(/\r?\n/)

  const patterns = [
    /^\s*import\s+.+\s+from\s+"([^"]+)"/i,
    /^\s*@data\s+from\s+"([^"]+)"/i,
  ]

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    for (const pattern of patterns) {
      const match = line.match(pattern)
      const raw = match?.[1]
      if (!raw) continue

      const resolved = resolveWorkspacePath(raw, ownerPath)
      if (workspaceFiles.has(resolved)) continue

      const quoted = `"${raw}"`
      const start = Math.max(1, line.indexOf(quoted) + 2)
      diagnostics.push({
        message: `Unresolved import path: ${raw}`,
        line: i + 1,
        column: start,
        endColumn: start + raw.length,
      })
    }
  }

  return diagnostics
}

function resolveWorkspacePath(raw: string, ownerPath?: string): string {
  const normalizedRaw = normalizePath(raw)
  if (!normalizedRaw.startsWith('./')) {
    return normalizedRaw.replace(/^\/+/, '')
  }

  const owner = normalizePath(ownerPath)
  const ownerDir = owner.includes('/') ? owner.slice(0, owner.lastIndexOf('/')) : ''
  const relative = normalizedRaw.slice(2)
  return normalizePath(ownerDir ? `${ownerDir}/${relative}` : relative)
}

function normalizePath(path: string | undefined): string {
  return (path ?? '').replace(/\\/g, '/').trim()
}

function normalizeMode(mode: TemplateMode | string | number | null | undefined): TemplateMode | null {
  if (mode === null || mode === undefined) return null
  if (typeof mode === 'number') return null

  const normalized = String(mode).trim().toLowerCase()
  if (normalized === 'fullclass') return 'FullClass'
  return null
}
