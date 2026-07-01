vi.mock('@/services/templateService', () => ({ getTemplate: vi.fn() }))

import { getTemplate } from '@/services/templateService'
import {
  renderDeclarative,
  renderReport,
  renderById,
  renderWorkspaceFile,
  getSupportedFormats,
} from '@/services/reportService'

function mockFetchOk() {
  return vi.fn(async (_url: string | URL, _init?: RequestInit) => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/pdf' },
    blob: async () => new Blob(['%PDF']),
    text: async () => '',
  }))
}

function mockFetchFail(status: number, statusText: string, body = '') {
  return vi.fn(async (_url: string | URL, _init?: RequestInit) => ({
    ok: false,
    status,
    statusText,
    text: async () => body,
  }))
}

describe('reportService.renderDeclarative', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('forwards Modules in the request body when provided', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderDeclarative(
      'kind: report',
      { a: 1 },
      {
        format: 'pdf',
        modules: ['kind: styles\nname: s'],
      },
    )

    expect(fetchMock).toHaveBeenCalledOnce()
    const call = fetchMock.mock.calls[0]
    expect(String(call[0])).toContain('/api/report/render-declarative?format=pdf')
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect(body.Definition).toBe('kind: report')
    expect(body.Modules).toEqual(['kind: styles\nname: s'])
  })

  it('omits Modules when none are passed (self-contained report)', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderDeclarative('kind: report', {}, { format: 'excel' })

    const call = fetchMock.mock.calls[0]
    expect(String(call[0])).toContain('format=excel')
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect('Modules' in body).toBe(false)
  })

  it('surfaces a parsed API error message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchFail(400, 'Bad Request', '{"error":"bad yaml"}'))
    await expect(renderDeclarative('kind: report', {}, {})).rejects.toThrow('bad yaml')
  })
})

describe('reportService.renderReport', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('posts the template/data/mode payload and defaults format to pdf', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    const result = await renderReport('class T {}', { x: 1 }, 'FullClass')

    const call = fetchMock.mock.calls[0]
    expect(String(call[0])).toContain('/api/report/render?format=pdf')
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect(body.Template).toBe('class T {}')
    expect(body.FileName).toBe('report')
    expect(body.Data).toEqual({ x: 1 })
    expect(body.Mode).toBe('FullClass')
    expect('PageSettings' in body).toBe(false)
    expect('FormatHints' in body).toBe(false)
    expect(result.fileExtension).toBe('.pdf')
  })

  it('includes PageSettings and FormatHints when provided, and infers .xlsx from content type', async () => {
    const fetchMock = vi.fn(async (_url: string | URL, _init?: RequestInit) => ({
      ok: true,
      headers: { get: () => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      blob: async () => new Blob(['xlsx']),
      text: async () => '',
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await renderReport('class T {}', {}, 'FullClass', {
      fileName: 'sales',
      pageSettings: { pageSize: 'A4' },
      formatHints: { col1: 'currency' },
    })

    const call = fetchMock.mock.calls[0]
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect(body.FileName).toBe('sales')
    expect(body.PageSettings).toEqual({ pageSize: 'A4' })
    expect(body.FormatHints).toEqual({ col1: 'currency' })
    expect(result.fileExtension).toBe('.xlsx')
  })

  it('throws with the parsed API error message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchFail(500, 'Server Error', '{"message":"compile failed"}'))
    await expect(renderReport('bad', {}, 'FullClass')).rejects.toThrow('compile failed')
  })
})

describe('reportService.renderById', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the explicit format option without calling getTemplate', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderById('t1', undefined, { format: 'excel', version: 3 })

    expect(getTemplate).not.toHaveBeenCalled()
    const call = fetchMock.mock.calls[0]
    expect(String(call[0])).toContain('/api/report/render/t1')
    expect(String(call[0])).toContain('format=excel')
    expect(String(call[0])).toContain('version=3')
  })

  it('falls back to the template outputFormat when no format is given', async () => {
    vi.mocked(getTemplate).mockResolvedValue({ outputFormat: 'excel' } as never)
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderById('t2')

    expect(getTemplate).toHaveBeenCalledWith('t2')
    expect(String(fetchMock.mock.calls[0][0])).toContain('format=excel')
  })

  it('falls back to pdf when getTemplate rejects', async () => {
    vi.mocked(getTemplate).mockRejectedValue(new Error('not found'))
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderById('missing')

    expect(String(fetchMock.mock.calls[0][0])).toContain('format=pdf')
  })

  it('sends FormatHints as a JSON body with content-type header when provided', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderById('t3', undefined, { format: 'pdf', formatHints: { a: 'b' } })

    const call = fetchMock.mock.calls[0]
    const init = call[1] as RequestInit
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({ FormatHints: { a: 'b' } })
  })

  it('throws with the parsed API error message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchFail(404, 'Not Found', '{"title":"missing template"}'))
    await expect(renderById('gone', undefined, { format: 'pdf' })).rejects.toThrow(
      'missing template',
    )
  })
})

describe('reportService.renderWorkspaceFile', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('posts templatePath/dataSourcePath/data/fileName with defaults applied', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderWorkspaceFile({ templatePath: 'a.cs' })

    const call = fetchMock.mock.calls[0]
    expect(String(call[0])).toContain('/api/report/render/file?format=pdf')
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect(body).toEqual({
      templatePath: 'a.cs',
      dataSourcePath: undefined,
      data: {},
      fileName: 'report',
    })
  })

  it('forwards explicit dataSourcePath/data/fileName and format', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderWorkspaceFile(
      { templatePath: 'a.cs', dataSourcePath: 'a.json', data: { x: 1 }, fileName: 'custom' },
      { format: 'excel' },
    )

    const call = fetchMock.mock.calls[0]
    expect(String(call[0])).toContain('format=excel')
    const body = JSON.parse((call[1] as RequestInit).body as string)
    expect(body).toEqual({
      templatePath: 'a.cs',
      dataSourcePath: 'a.json',
      data: { x: 1 },
      fileName: 'custom',
    })
  })

  it('throws with the parsed API error message on failure', async () => {
    vi.stubGlobal('fetch', mockFetchFail(400, 'Bad Request', '{"error":"path required"}'))
    await expect(renderWorkspaceFile({ templatePath: '' })).rejects.toThrow('path required')
  })
})

describe('reportService.getSupportedFormats', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the parsed formats list on success', async () => {
    const formats = [{ format: 'pdf', contentType: 'application/pdf', fileExtension: '.pdf' }]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => formats })),
    )

    expect(await getSupportedFormats()).toEqual(formats)
  })

  it('falls back to the default pdf format when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500 })),
    )

    expect(await getSupportedFormats()).toEqual([
      { format: 'pdf', contentType: 'application/pdf', fileExtension: '.pdf' },
    ])
  })

  it('falls back to the default pdf format when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )

    expect(await getSupportedFormats()).toEqual([
      { format: 'pdf', contentType: 'application/pdf', fileExtension: '.pdf' },
    ])
  })
})
