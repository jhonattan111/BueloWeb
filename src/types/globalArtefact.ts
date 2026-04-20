export interface GlobalArtefact {
  id: string
  name: string        // slug-safe, e.g. "colaborador"
  extension: string   // e.g. ".json", ".buelo", ".csx"
  content: string
  description?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}
