import { ref } from 'vue'
import { validateProject } from '@/services/validateService'
import type { ProjectValidationResult } from '@/services/validateService'
import { useWorkspaceTree } from '@/composables/useWorkspaceTree'
import type { FileNode } from '@/types/workspace'

const isValidating = ref(false)
const result = ref<ProjectValidationResult | null>(null)
const error = ref<string | null>(null)
const panelOpen = ref(false)

export interface UseProjectValidation {
  isValidating: typeof isValidating
  result: typeof result
  error: typeof error
  panelOpen: typeof panelOpen
  runValidation(): Promise<void>
}

export const PROJECT_VALIDATION_KEY = Symbol('project-validation')

export function useProjectValidation(): UseProjectValidation {
  const { tree, setValidationResult, clearValidationResults } = useWorkspaceTree()

  async function runValidation(): Promise<void> {
    isValidating.value = true
    error.value = null
    panelOpen.value = true

    try {
      clearValidationResults()
      const validationResult = await validateProject()
      result.value = validationResult

      const nodes = flattenTree(tree.value)
      for (const entry of validationResult.files) {
        const normalizedPath = normalizePath(entry.path)

        // Always preserve backend key for direct lookups.
        setValidationResult(normalizedPath, entry.result)

        const matchedNodes = nodes.filter((node) => {
          const nodePath = normalizePath(node.path)
          if (nodePath && nodePath === normalizedPath) return true

          // Fallback: backend may return only file segment in some environments.
          const fileName = normalizedPath.split('/').at(-1)
          return Boolean(fileName) && node.name === fileName
        })

        for (const node of matchedNodes) {
          setValidationResult(node.id, entry.result)
          if (node.path) {
            setValidationResult(normalizePath(node.path), entry.result)
          }
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Validation failed'
    } finally {
      isValidating.value = false
    }
  }

  return { isValidating, result, error, panelOpen, runValidation }
}

function flattenTree(nodes: FileNode[]): FileNode[] {
  const all: FileNode[] = []

  for (const node of nodes) {
    all.push(node)
    if (node.children?.length) {
      all.push(...flattenTree(node.children))
    }
  }

  return all
}

function normalizePath(value: string | undefined): string {
  return (value ?? '').replace(/\\/g, '/').trim()
}
