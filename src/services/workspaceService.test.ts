import {
  listModuleDefinitions,
  fetchWorkspaceTree,
  getFile,
  saveFile,
  createFile,
  createFolder,
  renameNode,
  moveNode,
  deleteNode,
  listWorkspaceFilePaths,
  listJsonFiles,
  buildPath,
  fetchTypeDeclarations,
} from '@/services/workspaceService'

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

  it('skips module files whose content fetch throws (no crash, just excluded)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url)
      if (u.includes('/api/workspace/tree')) return { ok: true, json: async () => TREE }
      const path = new URL(u).searchParams.get('path')
      if (path?.includes('letterhead')) throw new Error('network blip')
      return {
        ok: true,
        json: async () => ({ path, name: path, extension: '.yml', content: `content-of:${path}` }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const modules = await listModuleDefinitions()
    expect(modules).toEqual(['content-of:examples/corporate.styles.yml'])
  })

  it('skips module files whose content is empty/blank', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const u = String(url)
      if (u.includes('/api/workspace/tree')) return { ok: true, json: async () => TREE }
      const path = new URL(u).searchParams.get('path')
      const content = path?.includes('letterhead') ? '   ' : `content-of:${path}`
      return { ok: true, json: async () => ({ path, name: path, extension: '.yml', content }) }
    })
    vi.stubGlobal('fetch', fetchMock)

    const modules = await listModuleDefinitions()
    expect(modules).toEqual(['content-of:examples/corporate.styles.yml'])
  })
})

describe('workspaceService.fetchWorkspaceTree', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('normalizes backslash paths and maps nested children', async () => {
    vi.stubGlobal(
      'fetch',
      ok([
        {
          path: 'examples\\a.cs',
          name: 'a.cs',
          type: 'file',
          extension: '.cs',
          kind: 'template',
          children: [],
        },
      ]),
    )

    const tree = await fetchWorkspaceTree()
    expect(tree[0].path).toBe('examples/a.cs')
    expect(tree[0].id).toBe('examples/a.cs')
  })

  it('throws a parsed error message when the request fails', async () => {
    vi.stubGlobal('fetch', fail(500, 'Server Error', '{"error":"tree unavailable"}'))
    await expect(fetchWorkspaceTree()).rejects.toThrow('tree unavailable')
  })
})

describe('workspaceService.getFile / saveFile', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('getFile queries by normalized path', async () => {
    const fn = ok({
      path: 'a.cs',
      name: 'a.cs',
      extension: '.cs',
      content: 'x',
      lastModifiedUtc: '',
    })
    vi.stubGlobal('fetch', fn)
    await getFile('folder\\a.cs')

    const url = String(fn.mock.calls[0][0])
    expect(url).toContain('/api/workspace/files/content?path=folder%2Fa.cs')
  })

  it('saveFile PUTs content with createIfMissing defaulting to false', async () => {
    const fn = ok({
      path: 'a.cs',
      name: 'a.cs',
      extension: '.cs',
      content: 'y',
      lastModifiedUtc: '',
    })
    vi.stubGlobal('fetch', fn)
    await saveFile('a.cs', 'y')

    const init = fn.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual({
      path: 'a.cs',
      content: 'y',
      createIfMissing: false,
    })
  })

  it('saveFile forwards createIfMissing=true when requested', async () => {
    const fn = ok({
      path: 'a.cs',
      name: 'a.cs',
      extension: '.cs',
      content: 'y',
      lastModifiedUtc: '',
    })
    vi.stubGlobal('fetch', fn)
    await saveFile('a.cs', 'y', true)

    const init = fn.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string).createIfMissing).toBe(true)
  })
})

describe('workspaceService.createFile / createFolder', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('createFile POSTs path/content/overwrite with defaults', async () => {
    const fn = ok({
      path: 'a.cs',
      name: 'a.cs',
      extension: '.cs',
      content: '',
      lastModifiedUtc: '',
    })
    vi.stubGlobal('fetch', fn)
    await createFile('a.cs')

    const init = fn.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ path: 'a.cs', content: '', overwrite: false })
  })

  it('createFolder POSTs the normalized path and resolves on success', async () => {
    const fn = vi.fn(async (_url: string | URL, _init?: RequestInit) => ({ ok: true }))
    vi.stubGlobal('fetch', fn)
    await expect(createFolder('a\\b')).resolves.toBeUndefined()

    const init = fn.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ path: 'a/b' })
  })

  it('createFolder throws a parsed error message on failure', async () => {
    vi.stubGlobal('fetch', fail(409, 'Conflict', '{"error":"already exists"}'))
    await expect(createFolder('a')).rejects.toThrow('already exists')
  })
})

describe('workspaceService.renameNode / moveNode / deleteNode', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renameNode PATCHes trimmed newName with overwrite defaulting to false', async () => {
    const fn = vi.fn(async (_url: string | URL, _init?: RequestInit) => ({ ok: true }))
    vi.stubGlobal('fetch', fn)
    await renameNode('a.cs', '  b.cs  ')

    const init = fn.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({
      path: 'a.cs',
      newName: 'b.cs',
      overwrite: false,
    })
  })

  it('renameNode throws a parsed error message on failure', async () => {
    vi.stubGlobal('fetch', fail(409, 'Conflict', '{"error":"name taken"}'))
    await expect(renameNode('a.cs', 'b.cs')).rejects.toThrow('name taken')
  })

  it('moveNode PATCHes normalized source/destination paths', async () => {
    const fn = vi.fn(async (_url: string | URL, _init?: RequestInit) => ({ ok: true }))
    vi.stubGlobal('fetch', fn)
    await moveNode('a\\x.cs', 'b\\x.cs', true)

    const init = fn.mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({
      path: 'a/x.cs',
      destinationPath: 'b/x.cs',
      overwrite: true,
    })
  })

  it('moveNode throws a parsed error message on failure', async () => {
    vi.stubGlobal('fetch', fail(400, 'Bad', '{"error":"invalid destination"}'))
    await expect(moveNode('a.cs', 'b.cs')).rejects.toThrow('invalid destination')
  })

  it('deleteNode DELETEs by query path', async () => {
    const fn = vi.fn(async (_url: string | URL, _init?: RequestInit) => ({ ok: true }))
    vi.stubGlobal('fetch', fn)
    await deleteNode('a.cs')

    const call = fn.mock.calls[0]
    expect(String(call[0])).toContain('/api/workspace/nodes?path=a.cs')
    expect((call[1] as RequestInit).method).toBe('DELETE')
  })

  it('deleteNode throws a parsed error message on failure', async () => {
    vi.stubGlobal('fetch', fail(404, 'Not Found', '{"error":"missing node"}'))
    await expect(deleteNode('gone.cs')).rejects.toThrow('missing node')
  })
})

describe('workspaceService.listWorkspaceFilePaths / listJsonFiles', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('listWorkspaceFilePaths flattens the tree to file paths only (folders excluded)', async () => {
    vi.stubGlobal('fetch', ok(TREE))
    const paths = await listWorkspaceFilePaths()

    expect(paths).toEqual([
      'examples/invoice.report.yml',
      'examples/corporate.styles.yml',
      'examples/letterhead.component.yml',
      'examples/data.json',
    ])
  })

  it('listJsonFiles filters to .json paths only', async () => {
    vi.stubGlobal('fetch', ok(TREE))
    const paths = await listJsonFiles()
    expect(paths).toEqual(['examples/data.json'])
  })
})

describe('workspaceService.buildPath', () => {
  it('joins a parent folder and file name', () => {
    expect(buildPath('examples', 'a.cs')).toBe('examples/a.cs')
  })

  it('returns just the leaf when there is no parent folder', () => {
    expect(buildPath(null, 'a.cs')).toBe('a.cs')
  })
})

describe('workspaceService.fetchTypeDeclarations', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns null for a non-.json path without calling fetch', async () => {
    const fn = vi.fn()
    vi.stubGlobal('fetch', fn)
    expect(await fetchTypeDeclarations('a.cs')).toBeNull()
    expect(fn).not.toHaveBeenCalled()
  })

  it('returns null for an empty path', async () => {
    expect(await fetchTypeDeclarations('')).toBeNull()
  })

  it('returns null when the API responds 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404 })),
    )
    expect(await fetchTypeDeclarations('a.json')).toBeNull()
  })

  it('returns the parsed declarations on success', async () => {
    vi.stubGlobal('fetch', ok({ path: 'a.json', csharpDeclarations: 'class A {}' }))
    const result = await fetchTypeDeclarations('a.json')
    expect(result).toEqual({ path: 'a.json', csharpDeclarations: 'class A {}' })
  })

  it('throws a parsed error message for non-404 failures', async () => {
    vi.stubGlobal('fetch', fail(500, 'Server Error', '{"error":"type inference failed"}'))
    await expect(fetchTypeDeclarations('a.json')).rejects.toThrow('type inference failed')
  })
})
