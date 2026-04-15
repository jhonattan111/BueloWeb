import type { Template, TemplateArtefact } from '@/types/template'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await response.text())
  }
  return response.json() as Promise<T>
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
    throw new Error(await response.text())
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
  const response = await fetch(
    `${BASE_URL}/api/templates/${templateId}/artefacts/${artefact.name}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artefact),
    },
  )
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export async function deleteArtefact(templateId: string, name: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/artefacts/${name}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

// ── Bundle export / import ────────────────────────────────────────────────────

export async function exportBundle(templateId: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/api/templates/${templateId}/export`)
  if (!response.ok) {
    throw new Error(await response.text())
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
