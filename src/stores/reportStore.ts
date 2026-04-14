import { defineStore } from 'pinia'
import { ref } from 'vue'
import { renderReport } from '@/services/reportService'

export const useReportStore = defineStore('report', () => {
  const pdfBlob = ref<Blob | null>(null)
  const isRendering = ref(false)
  const renderError = ref<string | null>(null)

  async function render(template: string, rawJson: string): Promise<void> {
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
      pdfBlob.value = await renderReport(template, data)
    } catch (err) {
      renderError.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isRendering.value = false
    }
  }

  return { pdfBlob, isRendering, renderError, render }
})
