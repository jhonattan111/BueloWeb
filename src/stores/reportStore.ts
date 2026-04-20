import { defineStore } from 'pinia'
import { ref } from 'vue'
import { renderReport, renderById } from '@/services/reportService'
import type { TemplateMode } from '@/types/template'

export const useReportStore = defineStore('report', () => {
  const pdfBlob = ref<Blob | null>(null)
  const isRendering = ref(false)
  const renderError = ref<string | null>(null)

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
      pdfBlob.value = await renderReport(template, data, mode)
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
      pdfBlob.value = await renderById(templateId, version)
    } catch (err) {
      renderError.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isRendering.value = false
    }
  }

  return { pdfBlob, isRendering, renderError, render, renderTemplate }
})
