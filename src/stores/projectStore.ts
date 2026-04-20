import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BueloProject, PageSettings } from '@/services/projectService'
import * as projectService from '@/services/projectService'

export const useProjectStore = defineStore('project', () => {
  const project = ref<BueloProject | null>(null)
  const isLoading = ref(false)
  const isDirty = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      project.value = await projectService.getProject()
      isDirty.value = false
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load project'
    } finally {
      isLoading.value = false
    }
  }

  async function save(): Promise<void> {
    if (!project.value) return
    isLoading.value = true
    error.value = null
    try {
      project.value = await projectService.updateProject(project.value)
      isDirty.value = false
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save project'
    } finally {
      isLoading.value = false
    }
  }

  async function savePageSettings(): Promise<void> {
    if (!project.value) return
    isLoading.value = true
    error.value = null
    try {
      project.value = await projectService.updatePageSettings(project.value.pageSettings)
      isDirty.value = false
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save page settings'
    } finally {
      isLoading.value = false
    }
  }

  async function saveMockData(): Promise<void> {
    if (!project.value) return
    isLoading.value = true
    error.value = null
    try {
      project.value = await projectService.updateMockData(project.value.mockData)
      isDirty.value = false
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save mock data'
    } finally {
      isLoading.value = false
    }
  }

  async function reset(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      project.value = await projectService.resetProject()
      isDirty.value = false
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to reset project'
    } finally {
      isLoading.value = false
    }
  }

  function markDirty(): void {
    isDirty.value = true
  }

  function patchPageSettings(patch: Partial<PageSettings>): void {
    if (!project.value) return
    project.value = {
      ...project.value,
      pageSettings: { ...project.value.pageSettings, ...patch },
    }
    isDirty.value = true
  }

  return {
    project,
    isLoading,
    isDirty,
    error,
    load,
    save,
    savePageSettings,
    saveMockData,
    reset,
    markDirty,
    patchPageSettings,
  }
})
