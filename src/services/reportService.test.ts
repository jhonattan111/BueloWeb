import { renderDeclarative } from '@/services/reportService'

function mockFetchOk() {
  return vi.fn(async (_url: string | URL, _init?: RequestInit) => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/pdf' },
    blob: async () => new Blob(['%PDF']),
    text: async () => '',
  }))
}

describe('reportService.renderDeclarative', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('forwards Modules in the request body when provided', async () => {
    const fetchMock = mockFetchOk()
    vi.stubGlobal('fetch', fetchMock)

    await renderDeclarative('kind: report', { a: 1 }, {
      format: 'pdf',
      modules: ['kind: styles\nname: s'],
    })

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
})
