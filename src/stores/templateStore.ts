import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Template } from '@/types/template'

const STORAGE_KEY = 'buelo:templates'

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<Template[]>([])
  const activeTemplateId = ref<string | null>(null)

  const activeTemplate = computed<Template | null>(
    () => templates.value.find((t) => t.id === activeTemplateId.value) ?? null,
  )

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates.value))
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      templates.value = raw ? (JSON.parse(raw) as Template[]) : []
    } catch {
      templates.value = []
    }
  }

  function createTemplate() {
    const t: Template = {
      id: crypto.randomUUID(),
      name: 'New Template',
      template: 'Hello, {{ name }}!',
      mockData: { name: 'World' },
    }
    templates.value.push(t)
    activeTemplateId.value = t.id
    persist()
  }

  function updateTemplate(id: string, patch: Partial<Omit<Template, 'id'>>) {
    const idx = templates.value.findIndex((t) => t.id === id)
    if (idx === -1) return
    templates.value[idx] = { ...templates.value[idx], ...patch }
    persist()
  }

  function deleteTemplate(id: string) {
    templates.value = templates.value.filter((t) => t.id !== id)
    if (activeTemplateId.value === id) {
      activeTemplateId.value = templates.value[0]?.id ?? null
    }
    persist()
  }

  function selectTemplate(id: string) {
    activeTemplateId.value = id
  }

  loadFromStorage()

  return {
    templates,
    activeTemplateId,
    activeTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
  }
})
