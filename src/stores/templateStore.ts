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
      const fetched = await templateService.listTemplates()
      templates.value = fetched.map(normalizeTemplateName)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load templates'
    } finally {
      isLoading.value = false
    }
  }

  async function createTemplate(options?: {
    name: string
    template?: string
    outputFormat?: 'pdf' | 'excel'
  }): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const name = options?.name?.trim() || 'New Template'
      const t = await templateService.createTemplate({
        name,
        template: options?.template ?? 'Hello, {{ name }}!',
        ...(options?.outputFormat ? { outputFormat: options.outputFormat } : {}),
        mockData: { name: 'World' },
        artefacts: [],
      })
      const normalized = normalizeTemplateName(t)
      templates.value.push(normalized)
      activeTemplateId.value = normalized.id
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create template'
    } finally {
      isLoading.value = false
    }
  }

  async function updateTemplate(id: string, patch: Partial<Omit<Template, 'id'>>) {
    error.value = null
    try {
      const current = templates.value.find((t) => t.id === id)
      if (!current) {
        error.value = 'Template not found in local store'
        return
      }

      const normalizedPatch: Partial<Omit<Template, 'id'>> = { ...patch }

      const rawName = Object.prototype.hasOwnProperty.call(normalizedPatch, 'name')
        ? normalizedPatch.name
        : current.name
      const normalizedName = rawName?.trim()
      if (!normalizedName) {
        error.value = 'Template name cannot be empty'
        return
      }

      normalizedPatch.name = normalizedName

      const { id: _, ...currentPayload } = current
      const payload: Omit<Template, 'id'> = {
        ...currentPayload,
        ...normalizedPatch,
        name: normalizedName,
      }

      const updated = await templateService.updateTemplate(id, payload)
      const idx = templates.value.findIndex((t) => t.id === id)
      if (idx !== -1) templates.value[idx] = normalizeTemplateName(updated)
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

function normalizeTemplateName(template: Template): Template {
  const name = template.name.trim()
  if (!name || isGuidLike(name)) {
    return {
      ...template,
      name: `[unnamed-${template.id.slice(0, 8)}]`,
    }
  }

  return {
    ...template,
    name,
  }
}

function isGuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

