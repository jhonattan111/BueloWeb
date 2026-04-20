import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { renderReport, renderById, getSupportedFormats } from '@/services/reportService'
import type { OutputFormat } from '@/services/reportService'
import type { TemplateMode } from '@/types/template'

export const useReportStore = defineStore('report', () => {
  const resultBlob = ref<Blob | null>(null)
  const resultContentType = ref<string | null>(null)
  const resultFileExtension = ref<string>('.pdf')
  const isRendering = ref(false)
  const renderError = ref<string | null>(null)

  // Format state
  const selectedFormat = ref<string>('pdf')
  const supportedFormats = ref<OutputFormat[]>([])
  const formatHints = ref<Record<string, string>>({})

  /** True when the last render produced a PDF */
  const isPdfResult = computed(() =>
    resultContentType.value?.includes('pdf') ?? false,
  )

  /** Backwards-compat: PDF blob only (used by external consumers that haven't been updated) */
  const pdfBlob = computed(() => (isPdfResult.value ? resultBlob.value : null))

  function setFormat(format: string): void {
    selectedFormat.value = format
  }

  function setFormatHint(key: string, value: string): void {
    formatHints.value = { ...formatHints.value, [key]: value }
  }

  async function loadFormats(): Promise<void> {
    try {
      const formats = await getSupportedFormats()
      supportedFormats.value = formats
      // If current selectedFormat is not in the list, reset to first
      if (!formats.some((f) => f.format === selectedFormat.value)) {
        selectedFormat.value = formats[0]?.format ?? 'pdf'
      }
    } catch {
      // keep default
    }
  }

  async function render(template: string, rawJson: string, mode: TemplateMode): Promise<void> {
    renderError.value = null

    if (mode === 'Partial') {
      renderError.value = 'Partial templates cannot be rendered directly. Use a Sections template.'
      return
    }

    let data: object
    try {
      data = JSON.parse(rawJson || '{}')
    } catch {
      renderError.value = 'Invalid JSON in Data tab.'
      return
    }

    isRendering.value = true
    try {
      const result = await renderReport(template, data, mode, {
        format: selectedFormat.value,
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
      const result = await renderById(templateId, undefined, {
        format: selectedFormat.value,
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
    // Format
    selectedFormat,
    supportedFormats,
    formatHints,
    // Actions
    render,
    renderTemplate,
    loadFormats,
    setFormat,
    setFormatHint,
  }
})
