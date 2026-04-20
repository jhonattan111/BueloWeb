import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { renderReport, renderById } from '@/services/reportService'
import type { TemplateMode } from '@/types/template'
import { useTemplateStore } from '@/stores/templateStore'

export const useReportStore = defineStore('report', () => {
  const resultBlob = ref<Blob | null>(null)
  const resultContentType = ref<string | null>(null)
  const resultFileExtension = ref<string>('.pdf')
  const isRendering = ref(false)
  const renderError = ref<string | null>(null)

  const formatHints = ref<Record<string, string>>({})
  const templateStore = useTemplateStore()

  /** True when the last render produced a PDF */
  const isPdfResult = computed(() =>
    resultContentType.value?.includes('pdf') ?? false,
  )

  /** Backwards-compat: PDF blob only (used by external consumers that haven't been updated) */
  const pdfBlob = computed(() => (isPdfResult.value ? resultBlob.value : null))

  function setFormatHint(key: string, value: string): void {
    formatHints.value = { ...formatHints.value, [key]: value }
  }

  async function render(template: string, rawJson: string, mode: TemplateMode): Promise<void> {
    renderError.value = null

    let data: object
    try {
      data = JSON.parse(rawJson || '{}')
    } catch {
      renderError.value = 'Invalid JSON in Data tab.'
      return
    }

    isRendering.value = true
    try {
      const format = templateStore.activeTemplate?.outputFormat ?? 'pdf'
      const result = await renderReport(template, data, mode, {
        format,
        formatHints: Object.keys(formatHints.value).length ? formatHints.value : undefined,
      })
      resultBlob.value = result.blob
      resultContentType.value = result.contentType
      resultFileExtension.value = result.fileExtension
    } catch (err) {
      renderError.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isRendering.value = false
    }
  }

  async function renderTemplate(templateId: string, version?: number): Promise<void> {
    renderError.value = null
    isRendering.value = true
    try {
      const activeTemplateFormat = templateStore.activeTemplate?.outputFormat
      const result = await renderById(templateId, undefined, {
        ...(activeTemplateFormat ? { format: activeTemplateFormat } : {}),
        version,
        formatHints: Object.keys(formatHints.value).length ? formatHints.value : undefined,
      })
      resultBlob.value = result.blob
      resultContentType.value = result.contentType
      resultFileExtension.value = result.fileExtension
    } catch (err) {
      renderError.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isRendering.value = false
    }
  }

  return {
    // Result
    resultBlob,
    resultContentType,
    resultFileExtension,
    pdfBlob,
    isPdfResult,
    // Status
    isRendering,
    renderError,
    formatHints,
    // Actions
    render,
    renderTemplate,
    setFormatHint,
  }
})
