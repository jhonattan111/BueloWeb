import type { TemplateMode } from '@/types/template'
import { getTemplate } from '@/services/templateService'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export interface OutputFormat {
  format: string
  contentType: string
  fileExtension: string
}

export interface RenderResult {
  blob: Blob
  contentType: string
  fileExtension: string
}

interface ReportRequest {
  Template: string
  FileName: string
  Data: object
  Mode: TemplateMode
  PageSettings?: unknown
  FormatHints?: Record<string, string>
}

export async function renderReport(
  template: string,
  data: object,
  mode: TemplateMode,
  options?: {
    format?: string
    formatHints?: Record<string, string>
    fileName?: string
  },
): Promise<RenderResult> {
  const format = options?.format ?? 'pdf'
  const payload: ReportRequest = {
    Template: template,
    FileName: options?.fileName ?? 'report',
    Data: data,
    Mode: mode,
    ...(options?.formatHints ? { FormatHints: options.formatHints } : {}),
  }

  const response = await fetch(`${BASE_URL}/api/report/render?format=${encodeURIComponent(format)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await readApiError(response)
    throw new Error(message || `Request failed: ${response.status}`)
  }

  const blob = await response.blob()
  const contentType = response.headers.get('Content-Type') ?? blob.type ?? 'application/octet-stream'
  const fileExtension = contentTypeToExtension(contentType)
  return { blob, contentType, fileExtension }
}

export async function renderById(
  templateId: string,
  _data?: unknown,
  options?: {
    format?: string
    version?: number
    formatHints?: Record<string, string>
  },
): Promise<RenderResult> {
  const format = options?.format ?? (await getTemplateOutputFormat(templateId))
  const params = new URLSearchParams({ format })
  if (options?.version !== undefined) params.set('version', String(options.version))

  const body = options?.formatHints ? JSON.stringify({ FormatHints: options.formatHints }) : undefined
  const headers: Record<string, string> = body ? { 'Content-Type': 'application/json' } : {}

  const response = await fetch(
    `${BASE_URL}/api/report/render/${templateId}?${params.toString()}`,
    { method: 'POST', headers, body },
  )
  if (!response.ok) {
    const message = await readApiError(response)
    throw new Error(message || `Request failed: ${response.status}`)
  }
  const blob = await response.blob()
  const contentType = response.headers.get('Content-Type') ?? blob.type ?? 'application/octet-stream'
  const fileExtension = contentTypeToExtension(contentType)
  return { blob, contentType, fileExtension }
}

async function getTemplateOutputFormat(templateId: string): Promise<string> {
  try {
    const template = await getTemplate(templateId)
    return template.outputFormat ?? 'pdf'
  } catch {
    return 'pdf'
  }
}

export async function getSupportedFormats(): Promise<OutputFormat[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/report/formats`)
    if (!response.ok) return fallbackFormats()
    return response.json() as Promise<OutputFormat[]>
  } catch {
    return fallbackFormats()
  }
}

function fallbackFormats(): OutputFormat[] {
  return [{ format: 'pdf', contentType: 'application/pdf', fileExtension: '.pdf' }]
}

function contentTypeToExtension(contentType: string): string {
  if (contentType.includes('pdf')) return '.pdf'
  if (contentType.includes('spreadsheetml') || contentType.includes('excel')) return '.xlsx'
  return '.bin'
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
