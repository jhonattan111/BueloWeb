export interface TemplateArtefact {
  name: string
  extension: string
  content: string
}

export interface Template {
  id: string
  name: string
  mode?: string
  template: string
  mockData: object
  artefacts: TemplateArtefact[]
}
