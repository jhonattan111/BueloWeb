import {
  listTemplates,
  getTemplate,
  deleteTemplate,
  createTemplate,
  updateTemplate,
  listArtefacts,
  getArtefact,
  upsertArtefact,
  deleteArtefact,
  listFiles,
  upsertFile,
  deleteFile,
  validateTemplate,
  listVersions,
  getVersion,
  restoreVersion,
} from '@/services/templateService'

function ok(body: unknown) {
  return vi.fn(async (_url: string | URL, _init?: RequestInit) => ({
    ok: true,
    json: async () => body,
  }))
}

function fail(status: number, statusText: string, body = '') {
  return vi.fn(async (_url: string | URL, _init?: RequestInit) => ({
    ok: false,
    status,
    statusText,
    text: async () => body,
  }))
}

describe('templateService', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('listTemplates returns the array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => [{ id: '1', name: 'a' }] })),
    )
    expect(await listTemplates()).toEqual([{ id: '1', name: 'a' }])
  })

  it('getTemplate hits /api/templates/:id', async () => {
    const fn = vi.fn(async (_url: string) => ({ ok: true, json: async () => ({ id: '7' }) }))
    vi.stubGlobal('fetch', fn)
    await getTemplate('7')
    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/7')
  })

  it('surfaces a parsed API error message ({error}) on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        statusText: 'Bad',
        text: async () => '{"error":"nope"}',
      })),
    )
    await expect(deleteTemplate('1')).rejects.toThrow('nope')
  })

  it('createTemplate POSTs the payload to /api/templates', async () => {
    const fn = ok({ id: 'new', name: 'x' })
    vi.stubGlobal('fetch', fn)
    const payload = { name: 'x', template: 'class T {}', mockData: {}, artefacts: [] }
    const created = await createTemplate(payload)

    expect(String(fn.mock.calls[0][0])).toContain('/api/templates')
    const init = fn.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(payload)
    expect(created).toEqual({ id: 'new', name: 'x' })
  })

  it('updateTemplate PUTs to /api/templates/:id', async () => {
    const fn = ok({ id: '7', name: 'renamed' })
    vi.stubGlobal('fetch', fn)
    await updateTemplate('7', { name: 'renamed' })

    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/7')
    const init = fn.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual({ name: 'renamed' })
  })

  it('listArtefacts hits the artefacts endpoint', async () => {
    const fn = ok([{ name: 'a', extension: '.cs' }])
    vi.stubGlobal('fetch', fn)
    const result = await listArtefacts('t1')

    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/t1/artefacts')
    expect(result).toEqual([{ name: 'a', extension: '.cs' }])
  })

  it('getArtefact hits /api/templates/:id/artefacts/:name', async () => {
    const fn = ok({ name: 'a', extension: '.cs', content: 'x' })
    vi.stubGlobal('fetch', fn)
    await getArtefact('t1', 'a')

    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/t1/artefacts/a')
  })

  it('upsertArtefact PUTs to the files endpoint with an inferred kind and derived path', async () => {
    const fn = vi.fn(async (_url: string | URL, _init?: RequestInit) => ({ ok: true }))
    vi.stubGlobal('fetch', fn)
    await upsertArtefact('t1', { name: 'helper', extension: '.helpers.cs', content: 'x' })

    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/t1/files')
    const init = fn.mock.calls[0][1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.path).toBe('helper.helpers.cs')
    expect(body.kind).toBe('helper')
  })

  it('upsertArtefact throws the parsed API error on failure', async () => {
    vi.stubGlobal('fetch', fail(500, 'Server Error', '{"error":"boom"}'))
    await expect(
      upsertArtefact('t1', { name: 'a', extension: '.cs', content: '' }),
    ).rejects.toThrow('boom')
  })

  it('deleteArtefact DELETEs against the files endpoint with the encoded name as path', async () => {
    const fn = vi.fn(async (_url: string | URL, _init?: RequestInit) => ({ ok: true }))
    vi.stubGlobal('fetch', fn)
    await deleteArtefact('t1', 'my file')

    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/t1/files?path=my%20file')
    expect((fn.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
  })

  it('deleteArtefact throws the parsed API error on failure', async () => {
    vi.stubGlobal('fetch', fail(404, 'Not Found', '{"error":"missing"}'))
    await expect(deleteArtefact('t1', 'gone')).rejects.toThrow('missing')
  })

  it('listFiles hits /api/templates/:id/files', async () => {
    const fn = ok([{ path: 'a.cs', kind: 'file', content: '' }])
    vi.stubGlobal('fetch', fn)
    const files = await listFiles('t1')

    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/t1/files')
    expect(files).toEqual([{ path: 'a.cs', kind: 'file', content: '' }])
  })

  it('upsertFile PUTs the payload as-is', async () => {
    const fn = ok({ path: 'a.data.json', kind: 'data', content: '{}' })
    vi.stubGlobal('fetch', fn)
    const payload = { path: 'a.data.json', content: '{}', kind: 'data' as const }
    await upsertFile('t1', payload)

    const init = fn.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual(payload)
  })

  it('deleteFile DELETEs by encoded path', async () => {
    const fn = vi.fn(async (_url: string | URL, _init?: RequestInit) => ({ ok: true }))
    vi.stubGlobal('fetch', fn)
    await deleteFile('t1', 'nested/a.cs')

    expect(String(fn.mock.calls[0][0])).toContain(encodeURIComponent('nested/a.cs'))
    expect((fn.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
  })

  it('deleteFile throws the parsed API error on failure', async () => {
    vi.stubGlobal('fetch', fail(400, 'Bad', '{"error":"cannot delete"}'))
    await expect(deleteFile('t1', 'a.cs')).rejects.toThrow('cannot delete')
  })

  it('validateTemplate POSTs template+mode to /api/report/validate', async () => {
    const fn = ok({ valid: true, errors: [] })
    vi.stubGlobal('fetch', fn)
    const result = await validateTemplate('class T {}', 'FullClass')

    expect(String(fn.mock.calls[0][0])).toContain('/api/report/validate')
    const init = fn.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ template: 'class T {}', mode: 'FullClass' })
    expect(result).toEqual({ valid: true, errors: [] })
  })

  it('listVersions hits /api/templates/:id/versions', async () => {
    const fn = ok([{ version: 1, savedAt: 'x', savedBy: null }])
    vi.stubGlobal('fetch', fn)
    await listVersions('t1')
    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/t1/versions')
  })

  it('getVersion hits /api/templates/:id/versions/:version', async () => {
    const fn = ok({ version: 3, template: 'x', artefacts: [], savedAt: 'y' })
    vi.stubGlobal('fetch', fn)
    await getVersion('t1', 3)
    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/t1/versions/3')
  })

  it('restoreVersion POSTs to /api/templates/:id/versions/:version/restore', async () => {
    const fn = ok({ id: 't1', name: 'restored' })
    vi.stubGlobal('fetch', fn)
    await restoreVersion('t1', 2)

    expect(String(fn.mock.calls[0][0])).toContain('/api/templates/t1/versions/2/restore')
    expect((fn.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })

  it('falls back to statusText when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', fail(500, 'Internal Server Error', 'not json'))
    await expect(deleteTemplate('1')).rejects.toThrow('not json')
  })

  it('falls back to a generic message when both body and statusText are empty', async () => {
    vi.stubGlobal('fetch', fail(500, ''))
    await expect(deleteTemplate('1')).rejects.toThrow('Request failed: 500')
  })
})
