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

const fakeResult = {
  blob: new Blob(['%PDF']),
  contentType: 'application/pdf',
  fileExtension: '.pdf',
}

describe('reportStore.renderDeclarativeWithSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('gathers and passes workspace modules when the report has import:', async () => {
    vi.mocked(workspaceService.listModuleDefinitions).mockResolvedValue(['kind: styles\nname: s'])
    vi.mocked(reportService.renderDeclarative).mockResolvedValue(fakeResult)

    const store = useReportStore()
    await store.renderDeclarativeWithSettings(
      'kind: report\nimport:\n  - styles: s',
      '{}',
      settings,
    )

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

describe('reportStore.render', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('parses JSON data, renders with the active template format, and stores the result', async () => {
    vi.mocked(reportService.renderReport).mockResolvedValue(fakeResult)

    const store = useReportStore()
    await store.render('class T {}', '{"a":1}', 'FullClass')

    expect(reportService.renderReport).toHaveBeenCalledWith(
      'class T {}',
      { a: 1 },
      'FullClass',
      expect.objectContaining({ format: 'pdf' }),
    )
    expect(store.resultBlob).toStrictEqual(fakeResult.blob)
    expect(store.resultContentType).toBe('application/pdf')
    expect(store.isPdfResult).toBe(true)
    expect(store.pdfBlob).toStrictEqual(fakeResult.blob)
    expect(store.isRendering).toBe(false)
  })

  it('defaults empty rawJson to {}', async () => {
    vi.mocked(reportService.renderReport).mockResolvedValue(fakeResult)

    const store = useReportStore()
    await store.render('class T {}', '', 'FullClass')

    expect(reportService.renderReport).toHaveBeenCalledWith(
      'class T {}',
      {},
      'FullClass',
      expect.anything(),
    )
  })

  it('sets renderError on invalid JSON and never calls renderReport', async () => {
    const store = useReportStore()
    await store.render('class T {}', '{ bad', 'FullClass')

    expect(store.renderError).toBe('Invalid JSON in Data tab.')
    expect(reportService.renderReport).not.toHaveBeenCalled()
  })

  it('captures a render failure in renderError and resets isRendering', async () => {
    vi.mocked(reportService.renderReport).mockRejectedValue(new Error('render boom'))

    const store = useReportStore()
    await store.render('class T {}', '{}', 'FullClass')

    expect(store.renderError).toBe('render boom')
    expect(store.isRendering).toBe(false)
  })

  it('forwards accumulated formatHints when set', async () => {
    vi.mocked(reportService.renderReport).mockResolvedValue(fakeResult)

    const store = useReportStore()
    store.setFormatHint('col1', 'currency')
    store.setFormatHint('col2', 'date')
    await store.render('class T {}', '{}', 'FullClass')

    const call = vi.mocked(reportService.renderReport).mock.calls[0]
    expect(call[3]?.formatHints).toEqual({ col1: 'currency', col2: 'date' })
    expect(store.formatHints).toEqual({ col1: 'currency', col2: 'date' })
  })
})

describe('reportStore.renderTemplate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders by id and stores the result', async () => {
    vi.mocked(reportService.renderById).mockResolvedValue(fakeResult)

    const store = useReportStore()
    await store.renderTemplate('t1', 3)

    expect(reportService.renderById).toHaveBeenCalledWith(
      't1',
      undefined,
      expect.objectContaining({ version: 3 }),
    )
    expect(store.resultBlob).toStrictEqual(fakeResult.blob)
    expect(store.isRendering).toBe(false)
  })

  it('captures a render failure in renderError', async () => {
    vi.mocked(reportService.renderById).mockRejectedValue(new Error('id render boom'))

    const store = useReportStore()
    await store.renderTemplate('t1')

    expect(store.renderError).toBe('id render boom')
  })
})

describe('reportStore.renderWorkspaceFile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders a workspace file with a default pdf format and stores the result', async () => {
    vi.mocked(reportService.renderWorkspaceFile).mockResolvedValue(fakeResult)

    const store = useReportStore()
    await store.renderWorkspaceFile({ templatePath: 'a.cs' })

    expect(reportService.renderWorkspaceFile).toHaveBeenCalledWith(
      expect.objectContaining({ templatePath: 'a.cs', data: {} }),
      { format: 'pdf' },
    )
    expect(store.resultBlob).toStrictEqual(fakeResult.blob)
  })

  it('captures a render failure in renderError', async () => {
    vi.mocked(reportService.renderWorkspaceFile).mockRejectedValue(
      new Error('workspace render boom'),
    )

    const store = useReportStore()
    await store.renderWorkspaceFile({ templatePath: 'a.cs' })

    expect(store.renderError).toBe('workspace render boom')
    expect(store.isRendering).toBe(false)
  })
})

describe('reportStore.renderWithSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('builds pageSettings from reportSettings and renders with FullClass mode', async () => {
    vi.mocked(reportService.renderReport).mockResolvedValue(fakeResult)

    const store = useReportStore()
    await store.renderWithSettings('class T {}', '{}', settings, 'invoice')

    const call = vi.mocked(reportService.renderReport).mock.calls[0]
    expect(call[2]).toBe('FullClass')
    expect(call[3]).toEqual(
      expect.objectContaining({
        format: 'pdf',
        fileName: 'invoice',
        pageSettings: expect.objectContaining({ pageSize: 'A4', showHeader: true }),
      }),
    )
  })

  it('sets renderError on invalid JSON and does not render', async () => {
    const store = useReportStore()
    await store.renderWithSettings('class T {}', '{ bad', settings)

    expect(store.renderError).toBe('Invalid JSON data.')
    expect(reportService.renderReport).not.toHaveBeenCalled()
  })

  it('captures a render failure in renderError', async () => {
    vi.mocked(reportService.renderReport).mockRejectedValue(new Error('settings render boom'))

    const store = useReportStore()
    await store.renderWithSettings('class T {}', '{}', settings)

    expect(store.renderError).toBe('settings render boom')
  })
})

describe('reportStore computed state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('isPdfResult/pdfBlob are false/null before any render', () => {
    const store = useReportStore()
    expect(store.isPdfResult).toBe(false)
    expect(store.pdfBlob).toBeNull()
  })

  it('pdfBlob is null when the last result is not a PDF (e.g. excel)', async () => {
    vi.mocked(reportService.renderReport).mockResolvedValue({
      blob: new Blob(['xlsx']),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExtension: '.xlsx',
    })

    const store = useReportStore()
    await store.render('class T {}', '{}', 'FullClass')

    expect(store.isPdfResult).toBe(false)
    expect(store.pdfBlob).toBeNull()
  })
})
