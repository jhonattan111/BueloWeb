export type TemplateMode = 'FullClass' | 'Builder' | 'Sections' | 'Partial'

export interface TemplateArtefact {
  path?: string
  name: string
  extension: string
  content: string
}

export type TemplateFileKind =
  | 'template'
  | 'template-sections'
  | 'template-partial'
  | 'data'
  | 'helper'
  | 'schema'
  | 'file'

export interface TemplateFile {
  path: string
  kind: TemplateFileKind
  content: string
  mode?: TemplateMode | null
}

export interface Template {
  id: string
  name: string
  mode?: TemplateMode
  template: string
  mockData: object
  artefacts: TemplateArtefact[]
}

export interface ValidateResult {
  valid: boolean
  errors: Array<{ message: string; line: number; column: number }>
}

export interface TemplateVersionMeta {
  version: number
  savedAt: string
  savedBy: string | null
}

export interface TemplateVersionSnapshot {
  version: number
  template: string
  artefacts: TemplateArtefact[]
  savedAt: string
}
