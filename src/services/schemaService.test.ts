import { fetchYamlSchemas } from '@/services/schemaService'

describe('schemaService.fetchYamlSchemas', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('binds each kind by the *.<kind>.yml convention and skips failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).endsWith('/report')) {
          return { ok: true, json: async () => ({ type: 'object', title: 'report' }) }
        }
        return { ok: false } // every other kind fails → skipped
      }),
    )

    const bindings = await fetchYamlSchemas()

    expect(bindings).toHaveLength(1)
    expect(bindings[0].fileMatch).toEqual(['*.report.yml', '*.report.yaml'])
    expect(bindings[0].schema).toEqual({ type: 'object', title: 'report' })
  })

  it('returns an empty list when no schema loads', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    expect(await fetchYamlSchemas()).toEqual([])
  })
})
