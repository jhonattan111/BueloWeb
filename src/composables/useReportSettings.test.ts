// useReportSettings transitively imports Monaco via buelo-language; stub those so the
// pure parsing/persistence functions can be tested without the editor runtime.
vi.mock('@/lib/buelo-language/csharpTypeInjector', () => ({ injectDataTypeDeclarations: vi.fn() }))
vi.mock('@/lib/buelo-language/csharpDataCompletions', () => ({ updateDataCompletions: vi.fn() }))

import { parseProjectBlock, presetFileSettings } from '@/composables/useReportSettings'

describe('useReportSettings.parseProjectBlock', () => {
  it('parses a @project block into settings', () => {
    const src = ['@project', '  pageSize: A3', '  outputFormat: excel', '  showHeader: false', '  dataSourcePath: data/x.json', ''].join('\n')
    const s = parseProjectBlock(src)
    expect(s.pageSize).toBe('A3')
    expect(s.outputFormat).toBe('excel')
    expect(s.showHeader).toBe(false)
    expect(s.dataSourcePath).toBe('data/x.json')
  })

  it('defaults outputFormat to pdf and returns {} without a @project block', () => {
    expect(parseProjectBlock('kind: report')).toEqual({})
    const s = parseProjectBlock('@project\n  pageSize: A4\n')
    expect(s.outputFormat).toBe('pdf')
  })
})

describe('useReportSettings.presetFileSettings', () => {
  // happy-dom doesn't reliably expose localStorage here; back it with an in-memory map.
  let store: Map<string, string>
  beforeEach(() => {
    store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('persists per-file settings to localStorage', () => {
    presetFileSettings('examples/sales.report.yml', {
      dataSourcePath: 'examples/sales.data.json',
      outputFormat: 'excel',
    })

    const stored = JSON.parse(store.get('buelo.reportSettings') ?? '{}')
    expect(stored['examples/sales.report.yml'].dataSourcePath).toBe('examples/sales.data.json')
    expect(stored['examples/sales.report.yml'].outputFormat).toBe('excel')
  })
})
