import { validateFile, validateProject } from '@/services/validateService'

function fetchReturning(res: unknown) {
  const fn = vi.fn(async () => res)
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('validateService.validateFile', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('skips .json (Monaco validates it natively) with no network call', async () => {
    const fn = fetchReturning({ ok: true, json: async () => ({}) })
    const res = await validateFile('.json', '{}')
    expect(res).toEqual({ valid: true, errors: [], warnings: [] })
    expect(fn).not.toHaveBeenCalled()
  })

  it('returns the backend result for a supported extension', async () => {
    const result = {
      valid: false,
      errors: [{ message: 'bad', line: 2, column: 1, severity: 'error' }],
      warnings: [],
    }
    fetchReturning({ ok: true, json: async () => result })
    expect(await validateFile('.cs', 'code')).toEqual(result)
  })

  it('maps a backend error response to a single error diagnostic', async () => {
    fetchReturning({ ok: false, status: 500, text: async () => 'boom' })
    const res = await validateFile('.cs', 'code')
    expect(res.valid).toBe(false)
    expect(res.errors[0].message).toBe('boom')
  })

  it('treats a network error as clean (no false validation errors)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )
    expect(await validateFile('.cs', 'code')).toEqual({ valid: true, errors: [], warnings: [] })
  })
})

describe('validateService.validateProject', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the aggregated result', async () => {
    const result = { valid: true, totalErrors: 0, totalWarnings: 0, files: [] }
    fetchReturning({ ok: true, json: async () => result })
    expect(await validateProject()).toEqual(result)
  })

  it('throws on a server error', async () => {
    fetchReturning({ ok: false, status: 500, text: async () => 'fail' })
    await expect(validateProject()).rejects.toThrow('fail')
  })
})
