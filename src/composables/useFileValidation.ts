import { ref, computed, onUnmounted, toValue, toRef, watch } from 'vue'
import type { Ref, MaybeRefOrGetter } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as monaco from 'monaco-editor'
import { validateFile } from '@/services/validateService'
import type { FileValidationResult } from '@/types/template'

const MARKER_OWNER = 'buelo-validate'

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

  const errorCount = computed(() => {
    const ext = toValue(extension)
    if (ext === '.json') {
      // Use Monaco's own JSON markers
      const model = toValue(monacoModel)
      if (!model) return 0
      return monaco.editor
        .getModelMarkers({ owner: 'json' })
        .filter((m) => m.resource.toString() === model.uri.toString() && m.severity === monaco.MarkerSeverity.Error)
        .length
    }
    return result.value?.errors.length ?? 0
  })

  const warningCount = computed(() => {
    const ext = toValue(extension)
    if (ext === '.json') {
      const model = toValue(monacoModel)
      if (!model) return 0
      return monaco.editor
        .getModelMarkers({ owner: 'json' })
        .filter((m) => m.resource.toString() === model.uri.toString() && m.severity === monaco.MarkerSeverity.Warning)
        .length
    }
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

    if (ext === '.json') {
      // Monaco handles JSON natively — no network call needed
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
  const stopWatch = watch(
    [toRef(content), toRef(extension)] as const,
    () => debouncedValidate(),
    { immediate: true },
  )

  onUnmounted(() => {
    stopWatch()
    clearMarkers()
  })

  return { isValidating, result, hasErrors, errorCount, warningCount }
}
