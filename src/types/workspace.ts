export type FileNodeType = 'template' | 'global-artefact' | 'folder'

export interface FileNode {
  id: string                  // Guid for templates/artefacts; folder path for folders
  name: string                // display name including extension, e.g. "colaborador.json"
  extension: string           // ".buelo", ".json", ".csx", ".cs"
  path?: string               // stable workspace-relative file path for project-wide validation mapping
  type: FileNodeType
  children?: FileNode[]       // for folder nodes
  parentId?: string           // template id for template-scoped files
}
