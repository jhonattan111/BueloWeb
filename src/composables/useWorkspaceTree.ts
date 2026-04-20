import { ref, reactive } from 'vue'
import type { Ref } from 'vue'
import type { FileNode } from '@/types/workspace'
import type { FileValidationResult } from '@/types/template'
import * as workspaceService from '@/services/workspaceService'
import * as templateService from '@/services/templateService'
import { useTemplateStore } from '@/stores/templateStore'

const tree = ref<FileNode[]>([])
const isLoading = ref(false)
const selectedNode = ref<FileNode | null>(null)
/** nodeId → latest FileValidationResult for tree badge display */
const validationState = reactive<Map<string, FileValidationResult>>(new Map())
let initialized = false

export function useWorkspaceTree(): {
  tree: Ref<FileNode[]>
  isLoading: Ref<boolean>
  selectedNode: Ref<FileNode | null>
  validationState: Map<string, FileValidationResult>
  refresh(): Promise<void>
  selectNode(node: FileNode): void
  createFile(parentId: string | null, name: string, extension: string, content?: string): Promise<FileNode>
  deleteFile(node: FileNode): Promise<void>
  renameTemplate(node: FileNode, newName: string): Promise<void>
  setValidationResult(nodeId: string, result: FileValidationResult): void
} {
  const templateStore = useTemplateStore()

  async function refresh(): Promise<void> {
    isLoading.value = true
    try {
      await templateStore.fetchTemplates()
      tree.value = await workspaceService.fetchWorkspaceTree()
    } finally {
      isLoading.value = false
    }
  }

  function selectNode(node: FileNode): void {
    selectedNode.value = node
  }

  async function createFile(
    parentId: string | null,
    name: string,
    extension: string,
    content = '',
  ): Promise<FileNode> {
    if (parentId) {
      // Template-scoped artefact
      const path = `${name}${extension}`
      await templateService.upsertFile(parentId, {
        path,
        content,
        kind: inferKindFromExtension(extension),
      })
      await refresh()
      const newNode: FileNode = {
        id: `${parentId}:${path}`,
        name: `${name}${extension}`,
        extension,
        type: 'template',
        parentId,
      }
      selectedNode.value = newNode
      return newNode
    } else {
      // Global artefact
      const created = await workspaceService.createGlobalArtefact({
        name,
        extension,
        content,
        tags: [],
      })
      await refresh()
      const newNode: FileNode = {
        id: created.id,
        name: `${created.name}${created.extension}`,
        extension: created.extension,
        type: 'global-artefact',
      }
      selectedNode.value = newNode
      return newNode
    }
  }

  async function deleteFile(node: FileNode): Promise<void> {
    if (node.type === 'global-artefact') {
      await workspaceService.deleteGlobalArtefact(node.id)
    } else if (node.type === 'folder') {
      // Delete template
      await templateStore.deleteTemplate(node.id)
    } else if (node.type === 'template' && node.parentId) {
      // Delete template artefact — extract path from id
      const filePath = node.id.split(':').slice(1).join(':')
      await templateService.deleteFile(node.parentId, filePath)
    }
    if (selectedNode.value?.id === node.id) {
      selectedNode.value = null
    }
    await refresh()
  }

  async function renameTemplate(node: FileNode, newName: string): Promise<void> {
    if (node.type !== 'folder') return
    await templateStore.updateTemplate(node.id, { name: newName })
    await refresh()
  }

  function setValidationResult(nodeId: string, result: FileValidationResult): void {
    validationState.set(nodeId, result)
  }

  if (!initialized) {
    initialized = true
    refresh()
  }

  return {
    tree,
    isLoading,
    selectedNode,
    validationState,
    refresh,
    selectNode,
    createFile,
    deleteFile,
    renameTemplate,
    setValidationResult,
  }
}

function inferKindFromExtension(
  ext: string,
): import('@/types/template').TemplateFileKind {
  if (ext === '.cs' || ext === '.csx') return 'helper'
  if (ext === '.json') return 'data'
  if (ext === '.buelo') return 'template-sections'
  return 'file'
}
