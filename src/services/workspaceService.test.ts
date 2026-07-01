import { listModuleDefinitions } from '@/services/workspaceService'

const TREE = [
  {
    path: 'examples',
    name: 'examples',
    type: 'folder',
    extension: '',
    kind: 'folder',
    children: [
      {
        path: 'examples/invoice.report.yml',
        name: 'invoice.report.yml',
        type: 'file',
        extension: '.yml',
        kind: 'report',
        children: [],
      },
      {
        path: 'examples/corporate.styles.yml',
        name: 'corporate.styles.yml',
        type: 'file',
        extension: '.yml',
        kind: 'file',
        children: [],
      },
      {
        path: 'examples/letterhead.component.yml',
        name: 'letterhead.component.yml',
        type: 'file',
        extension: '.yml',
        kind: 'file',
        children: [],
      },
      {
        path: 'examples/data.json',
        name: 'data.json',
        type: 'file',
        extension: '.json',
        kind: 'data',
        children: [],
      },
    ],
  },
]

describe('workspaceService.listModuleDefinitions', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns only module YAMLs (styles/component/...), skipping reports and data', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url)
      if (u.includes('/api/workspace/tree')) {
        return { ok: true, json: async () => TREE }
      }
      const path = new URL(u).searchParams.get('path')
      return {
        ok: true,
        json: async () => ({ path, name: path, extension: '.yml', content: `content-of:${path}` }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const modules = await listModuleDefinitions()

    expect(modules).toHaveLength(2)
    expect(modules).toContain('content-of:examples/corporate.styles.yml')
    expect(modules).toContain('content-of:examples/letterhead.component.yml')
    expect(modules.some((m) => m.includes('invoice.report.yml'))).toBe(false)
    expect(modules.some((m) => m.includes('data.json'))).toBe(false)
  })
})
