import { setActivePinia, createPinia } from 'pinia'
import type { ReportSettingsState } from '@/composables/useReportSettings'

// Mock the HTTP layers the store orchestrates.
vi.mock('@/services/reportService', () => ({
  renderReport: vi.fn(),
  renderById: vi.fn(),
  renderWorkspaceFile: vi.fn(),
  renderDeclarative: vi.fn(),
}))
vi.mock('@/services/workspaceService', () => ({
  listModuleDefinitions: vi.fn(),
}))
// reportStore pulls in templateStore → templateService; keep it inert.
vi.mock('@/services/templateService', () => ({
  listTemplates: vi.fn(async () => []),
  getTemplate: vi.fn(),
}))

import * as reportService from '@/services/reportService'
import * as workspaceService from '@/services/workspaceService'
import { useReportStore } from '@/stores/reportStore'

const settings: ReportSettingsState = {
  pageSize: 'A4',
  orientation: 'Portrait',
  showHeader: true,
  showFooter: true,
  outputFormat: 'pdf',
}

const fakeResult = { blob: new Blob(['%PDF']), contentType: 'application/pdf', fileExtension: '.pdf' }

describe('reportStore.renderDeclarativeWithSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('gathers and passes workspace modules when the report has import:', async () => {
    vi.mocked(workspaceService.listModuleDefinitions).mockResolvedValue(['kind: styles\nname: s'])
    vi.mocked(reportService.renderDeclarative).mockResolvedValue(fakeResult)

    const store = useReportStore()
    await store.renderDeclarativeWithSettings('kind: report\nimport:\n  - styles: s', '{}', settings)

    expect(workspaceService.listModuleDefinitions).toHaveBeenCalledOnce()
    const call = vi.mocked(reportService.renderDeclarative).mock.calls[0]
    expect(call[2]?.modules).toEqual(['kind: styles\nname: s'])
    expect(store.renderError).toBeNull()
    expect(store.resultFileExtension).toBe('.pdf')
  })

  it('does not gather modules for a self-contained report', async () => {
    vi.mocked(reportService.renderDeclarative).mockResolvedValue(fakeResult)

    const store = useReportStore()
    await store.renderDeclarativeWithSettings('kind: report\ncontent: []', '{}', settings)

    expect(workspaceService.listModuleDefinitions).not.toHaveBeenCalled()
    expect(vi.mocked(reportService.renderDeclarative).mock.calls[0][2]?.modules).toBeUndefined()
  })

  it('sets renderError on invalid JSON and does not render', async () => {
    const store = useReportStore()
    await store.renderDeclarativeWithSettings('kind: report', '{ not json', settings)

    expect(store.renderError).toBe('Invalid JSON data.')
    expect(reportService.renderDeclarative).not.toHaveBeenCalled()
  })

  it('captures a render failure in renderError', async () => {
    vi.mocked(reportService.renderDeclarative).mockRejectedValue(new Error('engine boom'))

    const store = useReportStore()
    await store.renderDeclarativeWithSettings('kind: report\ncontent: []', '{}', settings)

    expect(store.renderError).toBe('engine boom')
    expect(store.isRendering).toBe(false)
  })
})
