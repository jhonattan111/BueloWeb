export type FileNodeType = 'file' | 'folder'

export interface WorkspaceApiNode {
  path: string
  name: string
  type: 'file' | 'folder'
  extension: string
  kind: string
  children: WorkspaceApiNode[]
}

export interface WorkspaceFileRecord {
  path: string
  name: string
  extension: string
  content: string
  lastModifiedUtc: string
}

export interface FileNode {
  id: string
  path: string
  name: string
  type: FileNodeType
  extension: string
  kind: string
  children?: FileNode[]
}
