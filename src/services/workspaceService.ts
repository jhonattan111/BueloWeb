import type {
  FileNode,
  WorkspaceApiNode,
  WorkspaceFileRecord,
} from '@/types/workspace'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    throw new Error(raw || response.statusText || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

function mapNode(node: WorkspaceApiNode): FileNode {
  return {
    id: normalizePath(node.path),
    path: normalizePath(node.path),
    name: node.name,
    type: node.type,
    extension: node.extension,
    kind: node.kind,
    children: node.children?.map(mapNode),
  }
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').trim()
}

function joinPath(base: string | null | undefined, leaf: string): string {
  const cleanLeaf = leaf.replace(/^\/+/, '').trim()
  const cleanBase = normalizePath(base ?? '').replace(/\/+$/, '')
  if (!cleanBase) return cleanLeaf
  return `${cleanBase}/${cleanLeaf}`
}

export async function fetchWorkspaceTree(): Promise<FileNode[]> {
  const response = await fetch(`${BASE_URL}/api/workspace/tree`)
  const nodes = await readResponse<WorkspaceApiNode[]>(response)
  return nodes.map(mapNode)
}

export async function getFile(path: string): Promise<WorkspaceFileRecord> {
  const query = new URLSearchParams({ path: normalizePath(path) })
  const response = await fetch(`${BASE_URL}/api/workspace/files/content?${query.toString()}`)
  return readResponse<WorkspaceFileRecord>(response)
}

export async function saveFile(
  path: string,
  content: string,
  createIfMissing = false,
): Promise<WorkspaceFileRecord> {
  const response = await fetch(`${BASE_URL}/api/workspace/files/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: normalizePath(path), content, createIfMissing }),
  })
  return readResponse<WorkspaceFileRecord>(response)
}

export async function createFile(
  path: string,
  content = '',
  overwrite = false,
): Promise<WorkspaceFileRecord> {
  const response = await fetch(`${BASE_URL}/api/workspace/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: normalizePath(path), content, overwrite }),
  })
  return readResponse<WorkspaceFileRecord>(response)
}

export async function createFolder(path: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/workspace/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: normalizePath(path) }),
  })
  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    throw new Error(raw || response.statusText || `Request failed: ${response.status}`)
  }
}

export async function renameNode(path: string, newName: string, overwrite = false): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/workspace/files/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: normalizePath(path), newName: newName.trim(), overwrite }),
  })
  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    throw new Error(raw || response.statusText || `Request failed: ${response.status}`)
  }
}

export async function moveNode(path: string, destinationPath: string, overwrite = false): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/workspace/files/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: normalizePath(path),
      destinationPath: normalizePath(destinationPath),
      overwrite,
    }),
  })
  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    throw new Error(raw || response.statusText || `Request failed: ${response.status}`)
  }
}

export async function deleteNode(path: string): Promise<void> {
  const query = new URLSearchParams({ path: normalizePath(path) })
  const response = await fetch(`${BASE_URL}/api/workspace/nodes?${query.toString()}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    throw new Error(raw || response.statusText || `Request failed: ${response.status}`)
  }
}

export async function listWorkspaceFilePaths(): Promise<string[]> {
  const tree = await fetchWorkspaceTree()
  return flattenFiles(tree).map((node) => node.path)
}

export async function listJsonFiles(): Promise<string[]> {
  const paths = await listWorkspaceFilePaths()
  return paths.filter((path) => path.toLowerCase().endsWith('.json'))
}

export function buildPath(parentFolderPath: string | null, fileName: string): string {
  return joinPath(parentFolderPath, fileName)
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const all: FileNode[] = []
  for (const node of nodes) {
    if (node.type === 'file') {
      all.push(node)
    }
    if (node.children?.length) {
      all.push(...flattenFiles(node.children))
    }
  }
  return all
}
