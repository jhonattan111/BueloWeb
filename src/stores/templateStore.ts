import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Template } from '@/types/template'
import * as templateService from '@/services/templateService'

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<Template[]>([])
  const activeTemplateId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const activeTemplate = computed<Template | null>(
    () => templates.value.find((t) => t.id === activeTemplateId.value) ?? null,
  )

  async function fetchTemplates() {
    isLoading.value = true
    error.value = null
    try {
      templates.value = await templateService.listTemplates()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load templates'
    } finally {
      isLoading.value = false
    }
  }

  async function createTemplate() {
    isLoading.value = true
    error.value = null
    try {
      const t = await templateService.createTemplate({
        name: 'New Template',
        template: 'Hello, {{ name }}!',
        mockData: { name: 'World' },
      })
      templates.value.push(t)
      activeTemplateId.value = t.id
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create template'
    } finally {
      isLoading.value = false
    }
  }

  async function updateTemplate(id: string, patch: Partial<Omit<Template, 'id'>>) {
    error.value = null
    try {
      const updated = await templateService.updateTemplate(id, patch)
      const idx = templates.value.findIndex((t) => t.id === id)
      if (idx !== -1) templates.value[idx] = updated
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update template'
    }
  }

  async function deleteTemplate(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await templateService.deleteTemplate(id)
      templates.value = templates.value.filter((t) => t.id !== id)
      if (activeTemplateId.value === id) {
        activeTemplateId.value = templates.value[0]?.id ?? null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete template'
    } finally {
      isLoading.value = false
    }
  }

  function selectTemplate(id: string) {
    activeTemplateId.value = id
  }

  return {
    templates,
    activeTemplateId,
    activeTemplate,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
  }
})

