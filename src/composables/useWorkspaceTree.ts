import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import type { FileNode } from '@/types/workspace'
import type { FileValidationResult } from '@/types/template'
import * as workspaceService from '@/services/workspaceService'

const tree = ref<FileNode[]>([])
const isLoading = ref(false)
const selectedNode = ref<FileNode | null>(null)
const validationState = reactive<Map<string, FileValidationResult>>(new Map())
let initialized = false

function normalizePath(path: string | undefined): string {
  return (path ?? '').replace(/\\/g, '/').trim()
}

function fileNameOf(path: string): string {
  const normalized = normalizePath(path)
  return normalized.split('/').at(-1) ?? normalized
}

function extensionOf(name: string): string {
  const dotIndex = name.lastIndexOf('.')
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : ''
}

function inferKind(extension: string): string {
  if (extension === '.json') return 'data'
  if (extension === '.cs' || extension === '.csx') return 'helper'
  if (extension === '.cs') return 'template'
  return 'file'
}

export function useWorkspaceTree(): {
  tree: Ref<FileNode[]>
  isLoading: Ref<boolean>
  selectedNode: Ref<FileNode | null>
  validationState: Map<string, FileValidationResult>
  refresh(): Promise<void>
  selectNode(node: FileNode | null): void
  createFile(parentFolderPath: string | null, name: string, extension: string, content?: string): Promise<FileNode>
  createFolder(parentFolderPath: string | null, name: string): Promise<FileNode>
  deleteNode(node: FileNode): Promise<void>
  renameNode(node: FileNode, newName: string): Promise<void>
  setValidationResult(nodeId: string, result: FileValidationResult): void
  clearValidationResults(): void
} {
  async function refresh(): Promise<void> {
    const previousPath = normalizePath(selectedNode.value?.path)
    isLoading.value = true
    try {
      tree.value = await workspaceService.fetchWorkspaceTree()
      if (!previousPath) return
      selectedNode.value = findNodeByPath(tree.value, previousPath)
    } finally {
      isLoading.value = false
    }
  }

  function selectNode(node: FileNode | null): void {
    selectedNode.value = node
  }

  async function createFile(
    parentFolderPath: string | null,
    name: string,
    extension: string,
    content = '',
  ): Promise<FileNode> {
    const cleanName = name.trim()
    const finalName = cleanName.endsWith(extension) ? cleanName : `${cleanName}${extension}`
    const path = workspaceService.buildPath(parentFolderPath, finalName)
    const created = await workspaceService.createFile(path, content)
    await refresh()

    const node: FileNode = {
      id: normalizePath(created.path),
      path: normalizePath(created.path),
      name: created.name || fileNameOf(created.path),
      type: 'file',
      extension: created.extension || extensionOf(created.path),
      kind: inferKind(created.extension || extensionOf(created.path)),
    }

    const resolved = findNodeByPath(tree.value, node.path) ?? node
    selectedNode.value = resolved
    return resolved
  }

  async function createFolder(parentFolderPath: string | null, name: string): Promise<FileNode> {
    const path = workspaceService.buildPath(parentFolderPath, name.trim())
    await workspaceService.createFolder(path)
    await refresh()

    const node: FileNode = {
      id: normalizePath(path),
      path: normalizePath(path),
      name: fileNameOf(path),
      type: 'folder',
      extension: '',
      kind: 'folder',
      children: [],
    }

    const resolved = findNodeByPath(tree.value, node.path) ?? node
    selectedNode.value = resolved
    return resolved
  }

  async function deleteNode(node: FileNode): Promise<void> {
    await workspaceService.deleteNode(node.path)
    if (normalizePath(selectedNode.value?.path) === normalizePath(node.path)) {
      selectedNode.value = null
    }
    await refresh()
  }

  async function renameNode(node: FileNode, newName: string): Promise<void> {
    await workspaceService.renameNode(node.path, newName.trim())
    await refresh()
  }

  function setValidationResult(nodeId: string, result: FileValidationResult): void {
    validationState.set(nodeId, result)
  }

  function clearValidationResults(): void {
    validationState.clear()
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
    createFolder,
    deleteNode,
    renameNode,
    setValidationResult,
    clearValidationResults,
  }
}

function findNodeByPath(nodes: FileNode[], path: string): FileNode | null {
  const normalizedTarget = normalizePath(path)
  for (const node of nodes) {
    if (normalizePath(node.path) === normalizedTarget) return node
    if (node.children?.length) {
      const nested = findNodeByPath(node.children, normalizedTarget)
      if (nested) return nested
    }
  }
  return null
}
