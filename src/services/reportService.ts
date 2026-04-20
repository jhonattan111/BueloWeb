const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

enum TemplateMode {
  FullClass = 0,
  Builder = 1,
  Sections = 2,
  Partial = 3,
}

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
  fileName = 'report.pdf',
): Promise<Blob> {
  const payload: ReportRequest = {
    Template: template,
    FileName: fileName,
    Data: data,
    Mode: TemplateMode.Builder,
  }

  const response = await fetch(`${BASE_URL}/api/report/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
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
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `Request failed: ${response.status}`)
  }
  return response.blob()
}
