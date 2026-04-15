import { ref, watch } from 'vue'
import { useTemplateStore } from '@/stores/templateStore'
import * as templateService from '@/services/templateService'
import type { TemplateArtefact } from '@/types/template'

export function useActiveTemplate() {
  const templateStore = useTemplateStore()

  const artefacts = ref<TemplateArtefact[]>([])
  const activeArtefactName = ref<string | null>(null)
  const isLoading = ref(false)

  async function loadArtefacts(): Promise<void> {
    const id = templateStore.activeTemplateId
    if (!id) {
      artefacts.value = []
      return
    }
    isLoading.value = true
    try {
      const metas = await templateService.listArtefacts(id)
      const loaded = await Promise.all(metas.map((m) => templateService.getArtefact(id, m.name)))
      artefacts.value = loaded
    } catch {
      // Keep any previously loaded artefacts on error
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => templateStore.activeTemplateId,
    (id) => {
      activeArtefactName.value = null
      // Seed from store data immediately (avoids flash of empty tabs)
      artefacts.value = templateStore.activeTemplate?.artefacts ?? []
      if (id) loadArtefacts()
    },
    { immediate: true },
  )

  async function saveArtefact(artefact: TemplateArtefact): Promise<void> {
    const id = templateStore.activeTemplateId
    if (!id) return
    await templateService.upsertArtefact(id, artefact)
    const idx = artefacts.value.findIndex((a) => a.name === artefact.name)
    if (idx !== -1) {
      artefacts.value[idx] = artefact
    } else {
      artefacts.value.push(artefact)
    }
  }

  async function removeArtefact(name: string): Promise<void> {
    const id = templateStore.activeTemplateId
    if (!id) return
    await templateService.deleteArtefact(id, name)
    artefacts.value = artefacts.value.filter((a) => a.name !== name)
    if (activeArtefactName.value === name) {
      activeArtefactName.value = null
    }
  }

  return {
    artefacts,
    activeArtefactName,
    isLoading,
    loadArtefacts,
    saveArtefact,
    removeArtefact,
  }
}
