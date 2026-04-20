export type FileNodeType = 'template' | 'global-artefact' | 'project' | 'folder'

export interface FileNode {
  id: string                  // Guid for templates/artefacts; "project" for project file; folder path for folders
  name: string                // display name including extension, e.g. "colaborador.json"
  extension: string           // ".buelo", ".json", ".csx", ".cs", ".bueloproject"
  type: FileNodeType
  children?: FileNode[]       // for folder nodes
  parentId?: string           // template id for template-scoped files
}
