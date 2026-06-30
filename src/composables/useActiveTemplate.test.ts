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
})
