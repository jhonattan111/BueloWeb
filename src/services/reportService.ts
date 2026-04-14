const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export async function renderReport(template: string, data: object): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/api/report/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template, data, mode: 'Builder' }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.blob()
}
