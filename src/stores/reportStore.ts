import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { renderReport, renderById, renderWorkspaceFile as renderWorkspaceFileApi } from '@/services/reportService'
import type { TemplateMode } from '@/types/template'
import type { ReportSettingsState } from '@/composables/useReportSettings'
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

  async function renderWorkspaceFile(payload: {
    templatePath: string
    dataSourcePath?: string
    format?: string
    fileName?: string
  }): Promise<void> {
    renderError.value = null
    isRendering.value = true

    try {
      const result = await renderWorkspaceFileApi(
        {
          templatePath: payload.templatePath,
          dataSourcePath: payload.dataSourcePath,
          fileName: payload.fileName,
          data: {},
        },
        { format: payload.format ?? 'pdf' },
      )

      resultBlob.value = result.blob
      resultContentType.value = result.contentType
      resultFileExtension.value = result.fileExtension
    } catch (err) {
      renderError.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isRendering.value = false
    }
  }

  /**
   * Renders a workspace .cs template using explicit settings from the
   * Report Settings panel (page size, data source, output format, etc.).
   */
  async function renderWithSettings(
    template: string,
    rawJson: string,
    reportSettings: ReportSettingsState,
    baseName = 'report',
  ): Promise<void> {
    renderError.value = null

    let data: object
    try {
      data = JSON.parse(rawJson || '{}')
    } catch {
      renderError.value = 'Invalid JSON data.'
      return
    }

    isRendering.value = true
    try {
      const format = reportSettings.outputFormat ?? 'pdf'
      const pageSettings = {
        pageSize: reportSettings.pageSize,
        marginHorizontal: reportSettings.marginHorizontal ?? 2,
        marginVertical: reportSettings.marginVertical ?? 2,
        backgroundColor: reportSettings.backgroundColor ?? '#FFFFFF',
        defaultTextColor: reportSettings.defaultTextColor ?? '#000000',
        defaultFontSize: reportSettings.defaultFontSize ?? 12,
        showHeader: reportSettings.showHeader,
        showFooter: reportSettings.showFooter,
        watermarkText: reportSettings.watermarkText || null,
      }
      const result = await renderReport(template, data, 'FullClass', {
        format,
        fileName: baseName,
        pageSettings,
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
    renderWorkspaceFile,
    renderWithSettings,
    setFormatHint,
  }
})
