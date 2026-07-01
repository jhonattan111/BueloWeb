import { ref, computed, onUnmounted, toValue, toRef, watch } from 'vue'
import type { Ref, MaybeRefOrGetter } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as monaco from 'monaco-editor'
import { validateFile } from '@/services/validateService'
import type { FileValidationResult } from '@/types/template'

const MARKER_OWNER = 'buelo-validate'

// Extensions Monaco validates client-side (JSON natively, YAML via monaco-yaml + JSON Schemas).
// For these we read the editor markers instead of calling the server validator.
const MONACO_VALIDATED = new Set(['.json', '.yml', '.yaml'])

export interface UseFileValidationReturn {
  isValidating: Ref<boolean>
  result: Ref<FileValidationResult | null>
  hasErrors: Ref<boolean>
  errorCount: Ref<number>
  warningCount: Ref<number>
}

export function useFileValidation(
  content: MaybeRefOrGetter<string>,
  extension: MaybeRefOrGetter<string>,
  monacoModel: MaybeRefOrGetter<monaco.editor.ITextModel | null>,
): UseFileValidationReturn {
  const isValidating = ref(false)
  const result = ref<FileValidationResult | null>(null)

  // Bumped whenever Monaco markers for this model change, so the marker-based counts below
  // recompute reactively (getModelMarkers itself is not reactive).
  const markersVersion = ref(0)
  const markerListener = monaco.editor.onDidChangeMarkers((uris) => {
    const model = toValue(monacoModel)
    if (model && uris.some((u) => u.toString() === model.uri.toString())) {
      markersVersion.value++
    }
  })

  function countMarkers(severity: monaco.MarkerSeverity): number {
    // Touch markersVersion so this is reactive to marker changes.
    void markersVersion.value
    const model = toValue(monacoModel)
    if (!model) return 0
    return monaco.editor
      .getModelMarkers({ resource: model.uri })
      .filter((m) => m.severity === severity && m.owner !== MARKER_OWNER).length
  }

  const errorCount = computed(() => {
    if (MONACO_VALIDATED.has(toValue(extension))) return countMarkers(monaco.MarkerSeverity.Error)
    return result.value?.errors.length ?? 0
  })

  const warningCount = computed(() => {
    if (MONACO_VALIDATED.has(toValue(extension))) return countMarkers(monaco.MarkerSeverity.Warning)
    return result.value?.warnings.length ?? 0
  })

  const hasErrors = computed(() => errorCount.value > 0)

  function setMarkers(res: FileValidationResult): void {
    const model = toValue(monacoModel)
    if (!model) return

    const markers: monaco.editor.IMarkerData[] = [
      ...res.errors.map((d) => ({
        severity: monaco.MarkerSeverity.Error,
        message: d.message,
        startLineNumber: d.line,
        startColumn: d.column,
        endLineNumber: d.line,
        endColumn: d.column + 10,
      })),
      ...res.warnings.map((d) => ({
        severity: monaco.MarkerSeverity.Warning,
        message: d.message,
        startLineNumber: d.line,
        startColumn: d.column,
        endLineNumber: d.line,
        endColumn: d.column + 10,
      })),
    ]

    monaco.editor.setModelMarkers(model, MARKER_OWNER, markers)
  }

  function clearMarkers(): void {
    const model = toValue(monacoModel)
    if (model) monaco.editor.setModelMarkers(model, MARKER_OWNER, [])
  }

  async function runValidation(): Promise<void> {
    const ext = toValue(extension)
    const text = toValue(content)

    if (MONACO_VALIDATED.has(ext)) {
      // Monaco handles JSON/YAML natively (markers) — no network call, no "no validator" noise.
      result.value = { valid: true, errors: [], warnings: [] }
      return
    }

    isValidating.value = true
    try {
      const res = await validateFile(ext, text)
      // Re-check model is still live after async
      if (!toValue(monacoModel)) return
      result.value = res
      setMarkers(res)
    } finally {
      isValidating.value = false
    }
  }

  const debouncedValidate = useDebounceFn(runValidation, 1200)

  // Re-validate when content or extension changes
  const stopWatch = watch([toRef(content), toRef(extension)] as const, () => debouncedValidate(), {
    immediate: true,
  })

  onUnmounted(() => {
    stopWatch()
    markerListener.dispose()
    clearMarkers()
  })

  return { isValidating, result, hasErrors, errorCount, warningCount }
}
