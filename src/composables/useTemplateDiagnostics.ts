import { ref, watch, onUnmounted, type Ref, type MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as monaco from 'monaco-editor'
import * as templateService from '@/services/templateService'
import type { TemplateMode } from '@/types/template'

const ACTIVE_MODES: TemplateMode[] = ['Sections', 'Partial']
const MARKER_OWNER = 'buelo'

export function useTemplateDiagnostics(
  templateSource: MaybeRefOrGetter<string>,
  mode: MaybeRefOrGetter<TemplateMode | string | null | undefined>,
  monacoModel: MaybeRefOrGetter<monaco.editor.ITextModel | null>,
): { isValidating: Ref<boolean>; hasErrors: Ref<boolean>; validate: () => Promise<void> } {
  const isValidating = ref(false)
  const hasErrors = ref(false)

  function clearMarkers() {
    const model = toValue(monacoModel)
    if (model) monaco.editor.setModelMarkers(model, MARKER_OWNER, [])
    hasErrors.value = false
  }

  async function validate(): Promise<void> {
    const source = toValue(templateSource)
    const m = toValue(mode)
    const model = toValue(monacoModel)

    if (!m || !ACTIVE_MODES.includes(m as TemplateMode)) {
      clearMarkers()
      return
    }

    if (!model) return

    isValidating.value = true
    try {
      const result = await templateService.validateTemplate(source, m as TemplateMode)
      // Re-read model after async — it may have been disposed
      const currentModel = toValue(monacoModel)
      if (!currentModel) return

      const markers: monaco.editor.IMarkerData[] = result.errors.map((e) => ({
        severity: monaco.MarkerSeverity.Error,
        message: e.message,
        startLineNumber: e.line,
        endLineNumber: e.line,
        startColumn: e.column,
        endColumn: e.column + 1,
      }))
      monaco.editor.setModelMarkers(currentModel, MARKER_OWNER, markers)
      hasErrors.value = markers.length > 0
    } catch {
      // Network/server error — leave current markers intact
    } finally {
      isValidating.value = false
    }
  }

  const debouncedValidate = useDebounceFn(validate, 1500)

  const stopWatch = watch(
    () => toValue(templateSource),
    () => debouncedValidate(),
  )

  onUnmounted(() => {
    stopWatch()
    clearMarkers()
  })

  return { isValidating, hasErrors, validate }
}
