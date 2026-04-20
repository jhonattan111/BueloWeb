import type {
  Template,
  TemplateArtefact,
  TemplateFile,
  TemplateFileKind,
  TemplateMode,
  ValidateResult,
  TemplateVersionMeta,
  TemplateVersionSnapshot,
} from '@/types/template'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
  return response.json() as Promise<T>
}

async function readApiError(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '')
  if (!raw) return response.statusText || `Request failed: ${response.status}`

  try {
    const parsed = JSON.parse(raw) as { error?: string; message?: string; title?: string }
    return parsed.error || parsed.message || parsed.title || raw
  } catch {
    return raw
  }
}

export async function listTemplates(): Promise<Template[]> {
  const response = await fetch(`${BASE_URL}/api/templates`)
  return handleResponse<Template[]>(response)
}

export async function getTemplate(id: string): Promise<Template> {
  const response = await fetch(`${BASE_URL}/api/templates/${id}`)
  return handleResponse<Template>(response)
}

export async function createTemplate(payload: Omit<Template, 'id'>): Promise<Template> {
  const response = await fetch(`${BASE_URL}/api/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<Template>(response)
}

export async function updateTemplate(
  id: string,
  payload: Partial<Omit<Template, 'id'>>,
): Promise<Template> {
  const response = await fetch(`${BASE_URL}/api/templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<Template>(response)
}

export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/templates/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
}

// ── Artefact endpoints ────────────────────────────────────────────────────────

export async function listArtefacts(
  templateId: string,
): Promise<Pick<TemplateArtefact, 'name' | 'extension'>[]> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/artefacts`)
  return handleResponse<Pick<TemplateArtefact, 'name' | 'extension'>[]>(response)
}

export async function getArtefact(templateId: string, name: string): Promise<TemplateArtefact> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/artefacts/${name}`)
  return handleResponse<TemplateArtefact>(response)
}

export async function upsertArtefact(
  templateId: string,
  artefact: TemplateArtefact,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/files`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: artefact.path ?? `${artefact.name}${artefact.extension}`,
      content: artefact.content,
      kind: inferKindFromPath(artefact.path ?? `${artefact.name}${artefact.extension}`),
    }),
  })
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
}

export async function deleteArtefact(templateId: string, name: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/files?path=${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
}

export async function listFiles(templateId: string): Promise<TemplateFile[]> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/files`)
  return handleResponse<TemplateFile[]>(response)
}

export async function upsertFile(
  templateId: string,
  payload: { path: string; content: string; kind?: TemplateFileKind; mode?: TemplateMode },
): Promise<TemplateFile> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/files`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return handleResponse<TemplateFile>(response)
}

export async function deleteFile(templateId: string, path: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/files?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
}

// ── Bundle export / import ────────────────────────────────────────────────────

export async function exportBundle(templateId: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/export`)
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
  return response.blob()
}

export async function importBundle(file: File): Promise<Template> {
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(`${BASE_URL}/api/templates/import`, {
    method: 'POST',
    body: form,
  })
  return handleResponse<Template>(response)
}

// ── Validate ──────────────────────────────────────────────────────────────────

export async function validateTemplate(
  template: string,
  mode: TemplateMode,
): Promise<ValidateResult> {
  const response = await fetch(`${BASE_URL}/api/report/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, mode }),
  })
  return handleResponse<ValidateResult>(response)
}

// ── Version history ───────────────────────────────────────────────────────────

export async function listVersions(templateId: string): Promise<TemplateVersionMeta[]> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/versions`)
  return handleResponse<TemplateVersionMeta[]>(response)
}

export async function getVersion(
  templateId: string,
  version: number,
): Promise<TemplateVersionSnapshot> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/versions/${version}`)
  return handleResponse<TemplateVersionSnapshot>(response)
}

export async function restoreVersion(templateId: string, version: number): Promise<Template> {
  const response = await fetch(
    `${BASE_URL}/api/templates/${templateId}/versions/${version}/restore`,
    { method: 'POST' },
  )
  return handleResponse<Template>(response)
}

function inferKindFromPath(path: string): TemplateFileKind {
  if (path.endsWith('.helpers.cs')) return 'helper'
  if (path.endsWith('.schema.json')) return 'schema'
  if (path.endsWith('.data.json')) return 'data'
  if (path.endsWith('.cs')) return 'template'
  return 'file'
}
