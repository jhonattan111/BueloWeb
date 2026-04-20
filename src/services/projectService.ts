const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    let message = response.statusText || `Request failed: ${response.status}`
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { error?: string; message?: string; title?: string }
        message = parsed.error || parsed.message || parsed.title || raw
      } catch {
        message = raw
      }
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export interface PageSettings {
  pageSize: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal'
  marginHorizontal: number
  marginVertical: number
  backgroundColor: string
  defaultTextColor: string
  defaultFontSize: number
  showHeader: boolean
  showFooter: boolean
  watermarkText: string | null
}

export interface BueloProject {
  name: string
  description: string | null
  version: string
  pageSettings: PageSettings
  mockData: unknown
  defaultOutputFormat: 'pdf' | 'excel'
  createdAt: string
  updatedAt: string
}

export async function getProject(): Promise<BueloProject> {
  return handleResponse<BueloProject>(await fetch(`${BASE_URL}/api/project`))
}

export async function updateProject(project: BueloProject): Promise<BueloProject> {
  return handleResponse<BueloProject>(
    await fetch(`${BASE_URL}/api/project`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    }),
  )
}

export async function updatePageSettings(
  settings: Partial<PageSettings>,
): Promise<BueloProject> {
  return handleResponse<BueloProject>(
    await fetch(`${BASE_URL}/api/project/page-settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }),
  )
}

export async function updateMockData(data: unknown): Promise<BueloProject> {
  return handleResponse<BueloProject>(
    await fetch(`${BASE_URL}/api/project/mock-data`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  )
}

export async function resetProject(): Promise<BueloProject> {
  return handleResponse<BueloProject>(await fetch(`${BASE_URL}/api/project/reset`))
}
