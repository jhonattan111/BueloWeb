import type { FileNode } from '@/types/workspace'
import type { GlobalArtefact } from '../types/globalArtefact'
import * as templateService from '@/services/templateService'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    throw new Error(raw || response.statusText || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

// ── Global artefact endpoints ─────────────────────────────────────────────────

export async function listGlobalArtefacts(): Promise<GlobalArtefact[]> {
  const response = await fetch(`${BASE_URL}/api/artefacts`)
  return handleResponse<GlobalArtefact[]>(response)
}

export async function getGlobalArtefact(id: string): Promise<GlobalArtefact> {
  const response = await fetch(`${BASE_URL}/api/artefacts/${id}`)
  return handleResponse<GlobalArtefact>(response)
}

export async function createGlobalArtefact(
  artefact: Omit<GlobalArtefact, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<GlobalArtefact> {
  const response = await fetch(`${BASE_URL}/api/artefacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...artefact, id: '00000000-0000-0000-0000-000000000000' }),
  })
  return handleResponse<GlobalArtefact>(response)
}

export async function updateGlobalArtefact(
  id: string,
  artefact: Partial<Omit<GlobalArtefact, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<GlobalArtefact> {
  const response = await fetch(`${BASE_URL}/api/artefacts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(artefact),
  })
  return handleResponse<GlobalArtefact>(response)
}

export async function deleteGlobalArtefact(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/artefacts/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    throw new Error(raw || response.statusText)
  }
}

// ── Workspace tree builder ────────────────────────────────────────────────────

export async function fetchWorkspaceTree(): Promise<FileNode[]> {
  const [templates, globalArtefacts] = await Promise.all([
    templateService.listTemplates(),
    listGlobalArtefacts(),
  ])

  const templateNodes: FileNode[] = templates.map((t) => {
    const templateFileName = toTemplateFileName(t.name, t.id)
    return {
      id: t.id,
      name: templateFileName,
      extension: '.buelo',
      path: templateFileName,
      type: 'folder',
      children: buildTemplateChildren(t.id, templateFileName, t.artefacts),
    }
  })

  const globalFolderNode: FileNode | null =
    globalArtefacts.length === 0
      ? null
      : {
          id: '_global',
          name: '_global',
          extension: '',
          path: '_global',
          type: 'folder',
          children: globalArtefacts.map((a) => ({
            id: a.id,
            name: `${a.name}${a.extension}`,
            extension: a.extension,
            path: `_global/${a.name}${a.extension}`,
            type: 'global-artefact' as const,
          })),
        }

  return [...templateNodes, ...(globalFolderNode ? [globalFolderNode] : [])]
}

function buildTemplateChildren(
  templateId: string,
  templateFileName: string,
  artefacts: Array<{ path?: string; name: string; extension: string; content: string }>,
): FileNode[] {
  const templateRoot = templateFileName.replace(/\.buelo$/i, '')

  const artefactNodes: FileNode[] = artefacts.map((a) => {
    const filePath = a.path ?? `${a.name}${a.extension}`
    const fileName = filePath.split('/').at(-1) ?? filePath
    return {
      id: `${templateId}:${filePath}`,
      name: fileName,
      extension: a.extension,
      path: `${templateRoot}/${filePath}`,
      type: 'template' as const,
      parentId: templateId,
    }
  })

  return artefactNodes
}

function toTemplateFileName(name: string, id: string): string {
  const normalized = name.trim()
  if (!normalized || isGuidLike(normalized)) {
    return `[unnamed-${id.slice(0, 8)}].buelo`
  }

  return normalized.endsWith('.buelo') ? normalized : `${normalized}.buelo`
}

function isGuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
