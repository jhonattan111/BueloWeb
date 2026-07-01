import type { FileNode, WorkspaceFileRecord } from '@/types/workspace'

// Mock the HTTP layer so the composable's tree-building logic runs without a network.
vi.mock('@/services/workspaceService', () => ({
  fetchWorkspaceTree: vi.fn(),
  buildPath: vi.fn((parent: string | null, name: string) => (parent ? `${parent}/${name}` : name)),
  createFile: vi.fn(),
  createFolder: vi.fn(),
  deleteNode: vi.fn(),
  renameNode: vi.fn(),
}))

function folder(path: string, children: FileNode[] = []): FileNode {
  return {
    id: path,
    path,
    name: path.split('/').at(-1) ?? path,
    type: 'folder',
    extension: '',
    kind: 'folder',
    children,
  }
}

function file(path: string, kind = 'template', extension = '.cs'): FileNode {
  return {
    id: path,
    path,
    name: path.split('/').at(-1) ?? path,
    type: 'file',
    extension,
    kind,
  }
}

describe('useWorkspaceTree', () => {
  // Composable state is a module singleton; reset modules per test for isolation.
  let useWorkspaceTree: (typeof import('@/composables/useWorkspaceTree'))['useWorkspaceTree']
  let ws: typeof import('@/services/workspaceService')

  beforeEach(async () => {
    vi.resetModules()
    ws = await import('@/services/workspaceService')
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue([])
    ;({ useWorkspaceTree } = await import('@/composables/useWorkspaceTree'))
  })

  it('refresh loads the tree and flips isLoading around the call', async () => {
    const tree = [folder('examples', [file('examples/a.cs')])]
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue(tree)

    const api = useWorkspaceTree()
    const pending = api.refresh()
    expect(api.isLoading.value).toBe(true)
    await pending
    expect(api.isLoading.value).toBe(false)
    expect(api.tree.value).toEqual(tree)
  })

  it('refresh re-resolves the previously selected node by path after reloading', async () => {
    const nodeV1 = file('examples/a.cs')
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValueOnce([folder('examples', [nodeV1])])

    const api = useWorkspaceTree()
    await api.refresh()
    api.selectNode(nodeV1)
    expect(api.selectedNode.value?.path).toBe('examples/a.cs')

    // Second load returns a node with a different kind for the same path — proves
    // selection was re-resolved from the fresh tree, not just kept as the stale object.
    const nodeV2 = file('examples/a.cs', 'renamed-kind')
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValueOnce([folder('examples', [nodeV2])])
    await api.refresh()

    expect(api.selectedNode.value?.kind).toBe('renamed-kind')
  })

  it('refresh leaves selectedNode null when nothing was previously selected', async () => {
    const api = useWorkspaceTree()
    await api.refresh()
    expect(api.selectedNode.value).toBeNull()
  })

  it('selectNode sets and clears the selected node', () => {
    const api = useWorkspaceTree()
    const node = file('a.cs')
    api.selectNode(node)
    expect(api.selectedNode.value?.path).toBe('a.cs')
    api.selectNode(null)
    expect(api.selectedNode.value).toBeNull()
  })

  it('createFile builds the path, creates it, refreshes, and selects the resolved node', async () => {
    const created: WorkspaceFileRecord = {
      path: 'examples/new.cs',
      name: 'new.cs',
      extension: '.cs',
      content: '',
      lastModifiedUtc: '',
    }
    vi.mocked(ws.createFile).mockResolvedValue(created)
    const afterCreate = folder('examples', [file('examples/new.cs')])
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue([afterCreate])

    const api = useWorkspaceTree()
    const node = await api.createFile('examples', 'new', '.cs')

    expect(ws.buildPath).toHaveBeenCalledWith('examples', 'new.cs')
    expect(ws.createFile).toHaveBeenCalledWith('examples/new.cs', '')
    expect(node.path).toBe('examples/new.cs')
    expect(api.selectedNode.value).toBe(node)
  })

  it('createFile does not double the extension when the name already has it', async () => {
    const created: WorkspaceFileRecord = {
      path: 'a.cs',
      name: 'a.cs',
      extension: '.cs',
      content: '',
      lastModifiedUtc: '',
    }
    vi.mocked(ws.createFile).mockResolvedValue(created)
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue([])

    const api = useWorkspaceTree()
    await api.createFile(null, 'a.cs', '.cs')

    expect(ws.buildPath).toHaveBeenCalledWith(null, 'a.cs')
  })

  it('createFile falls back to a locally-built node when the refreshed tree lacks it', async () => {
    const created: WorkspaceFileRecord = {
      path: 'orphan.json',
      name: '',
      extension: '',
      content: '',
      lastModifiedUtc: '',
    }
    vi.mocked(ws.createFile).mockResolvedValue(created)
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue([])

    const api = useWorkspaceTree()
    const node = await api.createFile(null, 'orphan', '.json')

    // created.name/extension were both empty, so the node falls back to deriving
    // name/kind from created.path via fileNameOf()/extensionOf().
    expect(node.type).toBe('file')
    expect(node.name).toBe('orphan.json')
    expect(node.kind).toBe('data')
    expect(node.extension).toBe('.json')
  })

  it('createFolder creates the folder, refreshes, and selects the resolved node', async () => {
    vi.mocked(ws.createFolder).mockResolvedValue(undefined)
    const afterCreate = folder('newDir')
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue([afterCreate])

    const api = useWorkspaceTree()
    const node = await api.createFolder(null, 'newDir')

    expect(ws.createFolder).toHaveBeenCalledWith('newDir')
    expect(node.type).toBe('folder')
    expect(api.selectedNode.value).toBe(node)
  })

  it('deleteNode clears selection when deleting the selected node, then refreshes', async () => {
    const node = file('a.cs')
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue([])
    vi.mocked(ws.deleteNode).mockResolvedValue(undefined)

    const api = useWorkspaceTree()
    api.selectNode(node)
    await api.deleteNode(node)

    expect(ws.deleteNode).toHaveBeenCalledWith('a.cs')
    expect(api.selectedNode.value).toBeNull()
  })

  it('deleteNode preserves selection when deleting an unrelated node', async () => {
    const selected = file('keep.cs')
    // The post-delete refresh still needs to find 'keep.cs' in the tree to re-resolve it.
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue([selected])
    vi.mocked(ws.deleteNode).mockResolvedValue(undefined)

    const api = useWorkspaceTree()
    api.selectNode(selected)
    await api.deleteNode(file('other.cs'))

    expect(api.selectedNode.value?.path).toBe('keep.cs')
  })

  it('renameNode trims the new name and refreshes', async () => {
    vi.mocked(ws.renameNode).mockResolvedValue(undefined)
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValue([])

    const api = useWorkspaceTree()
    await api.renameNode(file('a.cs'), '  b.cs  ')

    expect(ws.renameNode).toHaveBeenCalledWith('a.cs', 'b.cs')
    expect(ws.fetchWorkspaceTree).toHaveBeenCalled()
  })

  it('setValidationResult / clearValidationResults manage the validation map', () => {
    const api = useWorkspaceTree()
    const result = { isValid: false, errors: ['boom'] } as never
    api.setValidationResult('a.cs', result)
    expect(api.validationState.get('a.cs')).toStrictEqual(result)
    api.clearValidationResults()
    expect(api.validationState.size).toBe(0)
  })

  it('findNodeByPath (via refresh) descends into nested folders to re-resolve selection', async () => {
    const nested = file('examples/nested/deep.cs')
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValueOnce([
      folder('examples', [folder('examples/nested', [nested])]),
    ])

    const api = useWorkspaceTree()
    await api.refresh()
    api.selectNode(nested)

    // Different kind marks this as the freshly-loaded object, proving the nested
    // lookup (not just a top-level scan) re-resolved the selection.
    const nestedV2 = file('examples/nested/deep.cs', 'renamed-kind')
    vi.mocked(ws.fetchWorkspaceTree).mockResolvedValueOnce([
      folder('examples', [folder('examples/nested', [nestedV2])]),
    ])
    await api.refresh()

    expect(api.selectedNode.value?.kind).toBe('renamed-kind')
  })
})
