import type { FileNode } from '@/types/workspace'
import type { GlobalArtefact } from '@/types/globalArtefact'
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

  const projectNode: FileNode = {
    id: 'project',
    name: 'project.bueloproject',
    extension: '.bueloproject',
    type: 'project',
  }

  const templateNodes: FileNode[] = templates.map((t) => ({
    id: t.id,
    name: t.name.endsWith('.buelo') ? t.name : `${t.name}.buelo`,
    extension: '.buelo',
    type: 'folder',
    children: buildTemplateChildren(t.id, t.artefacts),
  }))

  const globalFolderNode: FileNode | null =
    globalArtefacts.length === 0
      ? null
      : {
          id: '_global',
          name: '_global',
          extension: '',
          type: 'folder',
          children: globalArtefacts.map((a) => ({
            id: a.id,
            name: `${a.name}${a.extension}`,
            extension: a.extension,
            type: 'global-artefact' as const,
          })),
        }

  return [
    projectNode,
    ...templateNodes,
    ...(globalFolderNode ? [globalFolderNode] : []),
  ]
}

function buildTemplateChildren(
  templateId: string,
  artefacts: Array<{ path?: string; name: string; extension: string; content: string }>,
): FileNode[] {
  const main: FileNode = {
    id: `${templateId}:template.report.cs`,
    name: 'template.report.cs',
    extension: '.cs',
    type: 'template',
    parentId: templateId,
  }

  const data: FileNode = {
    id: `${templateId}:data/mock.data.json`,
    name: 'mock.data.json',
    extension: '.json',
    type: 'template',
    parentId: templateId,
  }

  const artefactNodes: FileNode[] = artefacts.map((a) => {
    const filePath = a.path ?? `${a.name}${a.extension}`
    const fileName = filePath.split('/').at(-1) ?? filePath
    return {
      id: `${templateId}:${filePath}`,
      name: fileName,
      extension: a.extension,
      type: 'template' as const,
      parentId: templateId,
    }
  })

  return [main, data, ...artefactNodes]
}
