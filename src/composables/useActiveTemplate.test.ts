import type { WorkspaceFileRecord } from '@/types/workspace'

// Mock the HTTP layer so the composable's open/save logic runs without a network.
vi.mock('@/services/workspaceService', () => ({
  getFile: vi.fn(),
  saveFile: vi.fn(),
  deleteNode: vi.fn(),
}))

function record(path: string, content: string): WorkspaceFileRecord {
  return {
    path,
    name: path.split('/').at(-1) ?? path,
    extension: '.yml',
    content,
    lastModifiedUtc: '',
  } as unknown as WorkspaceFileRecord
}

describe('useActiveTemplate — dirty state derived from a saved baseline', () => {
  // Composable state is a module singleton; reset modules per test for isolation.
  let useActiveTemplate: typeof import('@/composables/useActiveTemplate')['useActiveTemplate']
  let ws: typeof import('@/services/workspaceService')

  beforeEach(async () => {
    vi.resetModules()
    ws = await import('@/services/workspaceService')
    ;({ useActiveTemplate } = await import('@/composables/useActiveTemplate'))
  })

  it('clean after open, dirty after edit, clean again when edited back or saved', async () => {
    const path = 'examples/a.report.yml'
    vi.mocked(ws.getFile).mockResolvedValue(record(path, 'original'))
    vi.mocked(ws.saveFile).mockImplementation(async (p: string, content: string) => record(p, content))

    const api = useActiveTemplate()
    await api.openFile(path)
    expect(api.isDirty(path)).toBe(false)
    expect(api.hasUnsaved.value).toBe(false)

    api.setFileContent(path, 'edited')
    expect(api.isDirty(path)).toBe(true)
    expect(api.hasUnsaved.value).toBe(true)

    // Editing back to the original clears dirty — a baseline comparison, not a sticky flag.
    api.setFileContent(path, 'original')
    expect(api.isDirty(path)).toBe(false)

    api.setFileContent(path, 'edited again')
    await api.saveFile({ path, content: 'edited again' })
    expect(api.isDirty(path)).toBe(false)
  })

  it('closeFile drops the file and its dirty state', async () => {
    const path = 'examples/b.report.yml'
    vi.mocked(ws.getFile).mockResolvedValue(record(path, 'x'))

    const api = useActiveTemplate()
    await api.openFile(path)
    api.setFileContent(path, 'y')
    expect(api.isDirty(path)).toBe(true)

    api.closeFile(path)
    expect(api.isDirty(path)).toBe(false)
    expect(api.getFile(path)).toBeNull()
    expect(api.openPaths.value).not.toContain(path)
  })

  it('saveAllFiles persists only the dirty tabs and clears their dirty state', async () => {
    vi.mocked(ws.getFile).mockImplementation(async (p: string) => record(p, 'base'))
    vi.mocked(ws.saveFile).mockImplementation(async (p: string, content: string) => record(p, content))

    const api = useActiveTemplate()
    await api.openFile('a.report.yml')
    await api.openFile('b.report.yml')
    await api.openFile('c.report.yml')

    // Only a and c have unsaved edits.
    api.setFileContent('a.report.yml', 'edited-a')
    api.setFileContent('c.report.yml', 'edited-c')
    expect(api.hasUnsaved.value).toBe(true)

    vi.mocked(ws.saveFile).mockClear()
    await api.saveAllFiles()

    expect(ws.saveFile).toHaveBeenCalledTimes(2)
    const savedPaths = vi.mocked(ws.saveFile).mock.calls.map((call) => call[0])
    expect(savedPaths).toEqual(expect.arrayContaining(['a.report.yml', 'c.report.yml']))
    expect(savedPaths).not.toContain('b.report.yml')
    expect(api.hasUnsaved.value).toBe(false)
  })

  it('reorderTabs moves a tab to sit immediately before the target', async () => {
    vi.mocked(ws.getFile).mockImplementation(async (p: string) => record(p, 'x'))

    const api = useActiveTemplate()
    await api.openFile('a.yml')
    await api.openFile('b.yml')
    await api.openFile('c.yml')
    expect(api.openPaths.value).toEqual(['a.yml', 'b.yml', 'c.yml'])

    // Drop 'a' onto 'c' → 'a' lands just before 'c'.
    api.reorderTabs('a.yml', 'c.yml')
    expect(api.openPaths.value).toEqual(['b.yml', 'a.yml', 'c.yml'])

    // Dropping onto itself is a no-op.
    api.reorderTabs('a.yml', 'a.yml')
    expect(api.openPaths.value).toEqual(['b.yml', 'a.yml', 'c.yml'])
  })
})
