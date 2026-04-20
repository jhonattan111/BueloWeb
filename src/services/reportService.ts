import type { TemplateMode } from '@/types/template'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

interface ReportRequest {
  Template: string
  FileName: string
  Data: object
  Mode: TemplateMode
  PageSettings?: unknown
}

export async function renderReport(
  template: string,
  data: object,
  mode: TemplateMode,
  fileName = 'report.pdf',
): Promise<Blob> {
  const payload: ReportRequest = {
    Template: template,
    FileName: fileName,
    Data: data,
    Mode: mode,
  }

  const response = await fetch(`${BASE_URL}/api/report/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await readApiError(response)
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.blob()
}

export async function renderById(templateId: string, version?: number): Promise<Blob> {
  const url = version !== undefined
    ? `${BASE_URL}/api/report/render/${templateId}?version=${version}`
    : `${BASE_URL}/api/report/render/${templateId}`
  const response = await fetch(url, { method: 'POST' })
  if (!response.ok) {
    const message = await readApiError(response)
    throw new Error(message || `Request failed: ${response.status}`)
  }
  return response.blob()
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
