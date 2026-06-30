import { listTemplates, getTemplate, deleteTemplate } from '@/services/templateService'

describe('templateService', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('listTemplates returns the array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [{ id: '1', name: 'a' }] })))
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
      vi.fn(async () => ({ ok: false, status: 400, statusText: 'Bad', text: async () => '{"error":"nope"}' })),
    )
    await expect(deleteTemplate('1')).rejects.toThrow('nope')
  })
})
