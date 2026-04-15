import type { Template } from '@/types/template'

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
