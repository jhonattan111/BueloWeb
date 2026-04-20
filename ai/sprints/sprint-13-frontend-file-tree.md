# Sprint 13 (Frontend) — File Tree Sidebar

## Goal
Replace the flat template list sidebar with a **VSCode-style file tree** that shows all workspace files: templates (`.buelo`), data (`.json`), helpers (`.csx`/`.cs`), global artefacts, and the project file (`.bueloproject`). Opening any file in the tree opens it in an appropriate editor tab. Context menus enable CRUD operations.

## Status
`[ ] pending`

## Dependencies
- Sprint 13 backend complete ✅ (global artefact store + `/api/artefacts` endpoints)
- Sprint 15 backend complete ✅ (`/api/project` endpoint)
- Sprint 12 frontend complete ✅

---

## Compatibility Notes from Backend Changes
- `GET /api/artefacts` — list global artefacts (name, extension, description, tags)
- `GET /api/artefacts/{id}` — get global artefact with content
- `POST /api/artefacts` — create global artefact
- `PUT /api/artefacts/{id}` — update global artefact
- `DELETE /api/artefacts/{id}` — delete global artefact
- `GET /api/project` — get project settings
- `GET /api/templates` — existing endpoint (returns templates)

---

## Tasks

### FE-13.1 — File tree data model

File: `src/types/workspace.ts` (new file)

```ts
export type FileNodeType = 'template' | 'global-artefact' | 'project' | 'folder'

export interface FileNode {
  id: string                  // Guid for templates/artefacts; "project" for project file
  name: string                // display name including extension, e.g. "colaborador.json"
  extension: string           // ".buelo", ".json", ".csx", ".cs", ".bueloproject"
  type: FileNodeType
  children?: FileNode[]       // for folder nodes
  parentId?: string           // template id for template-scoped artefacts
}
```

---

### FE-13.2 — `workspaceService.ts`

File: `src/services/workspaceService.ts` (new file)

Aggregates data from multiple backend endpoints to build the workspace file tree:

```ts
export async function fetchWorkspaceTree(): Promise<FileNode[]>
```

Implementation:
1. `GET /api/templates` → each template becomes a folder node with its artefacts as children
2. `GET /api/artefacts` → global artefacts listed at root level under a `_global/` folder node
3. Project file always present as a root node: `{ id: 'project', name: 'project.bueloproject', extension: '.bueloproject', type: 'project' }`

---

### FE-13.3 — `useWorkspaceTree` composable

File: `src/composables/useWorkspaceTree.ts` (new file)

```ts
export function useWorkspaceTree(): {
  tree: Ref<FileNode[]>
  isLoading: Ref<boolean>
  refresh(): Promise<void>
  selectedNode: Ref<FileNode | null>
  selectNode(node: FileNode): void
  createFile(parentId: string | null, name: string, extension: string): Promise<FileNode>
  renameFile(node: FileNode, newName: string): Promise<void>
  deleteFile(node: FileNode): Promise<void>
}
```

State:
- `tree` — full tree, rebuilt on `refresh()`
- `selectedNode` — currently selected file
- CRUD operations call appropriate service methods and call `refresh()` on completion

---

### FE-13.4 — `FileTreePanel.vue` component

File: `src/components/layout/FileTreePanel.vue` (replaces `SidebarTemplates.vue`)

**Tree rendering**:
- Recursive `FileTreeNode.vue` component for each node
- Folder nodes: chevron toggle (expand/collapse), folder icon
- File nodes: icon by extension (see icon map below), file name

**File type icons** (using Lucide icons or SVG):
| Extension | Icon | Color hint |
|-----------|------|------------|
| `.buelo` | `FileCode` | blue |
| `.json` | `Braces` | yellow |
| `.csx` / `.cs` | `Code` | purple |
| `.bueloproject` | `Settings` | gray |

**Interactions**:
- Single click on file → `selectNode(node)` + emit `open-file` event
- Double click on file → same as single click (already opens)
- Right-click → context menu (see 13.5)
- `+` button next to folder → "New file" dialog

**Empty state**: "No files yet. Create a new template to get started." with a primary button.

---

### FE-13.5 — Context menu for file nodes

File: `src/components/layout/FileTreeContextMenu.vue` (new)

Uses existing `DropdownMenu` shadcn component. Options per node type:

| Node type | Menu options |
|-----------|-------------|
| Template folder | New artefact, Rename, Duplicate, Export bundle, Delete |
| Template artefact | Open, Rename, Delete |
| Global artefact | Open, Rename, Delete |
| Project file | Open (no delete/rename) |

Confirmation dialog (existing `AlertDialog`) before delete operations.

---

### FE-13.6 — `NewFileDialog.vue`

File: `src/components/editors/NewFileDialog.vue` (new)

Dialog for creating any workspace file:

Fields:
- **File name** (text input, without extension)
- **File type** (select): Report (`.buelo`), Partial (`.buelo`), Data (`.json`), Helper (`.csx`), Helper class (`.cs`)
- **Parent template** (select, optional): if set, file is created as a template artefact; if empty, created as global artefact
- **From template** (optional): pre-fills content with a starter snippet

On confirm:
- If parent template selected → `PUT /api/templates/{id}/artefacts/{name}` with empty content + extension
- If no parent → `POST /api/artefacts` with name, extension, empty content
- Refresh tree + select new node

---

### FE-13.7 — Wire file selection to editor

File: `src/pages/ReportEditor/Index.vue`

When `useWorkspaceTree.selectedNode` changes:
- `.buelo` template → load template via `useActiveTemplate`, open in `TemplateEditor`
- Template artefact → load artefact content, open in `ArtefactEditorTab` with correct Monaco language
- Global artefact → load global artefact, open as a new tab with correct language
- `.bueloproject` → navigate to project settings editor (Sprint 15 frontend)

Language selection per extension:
```ts
function languageForExtension(ext: string): string {
  switch (ext) {
    case '.buelo': return 'buelo'
    case '.json': return 'json'
    case '.cs': case '.csx': return 'csharp'
    case '.bueloproject': return 'json'
    default: return 'plaintext'
  }
}
```

---

### FE-13.8 — Replace `SidebarTemplates.vue` in `AppLayout.vue`

File: `src/components/layout/AppLayout.vue`

- Replace `<SidebarTemplates>` with `<FileTreePanel>`
- Pass `@open-file` event handler to wire file selection to editor
- Keep existing sidebar width / resize handle

---

## Final file structure additions

```
src/
  types/
    workspace.ts              ← NEW: FileNode, FileNodeType
  services/
    workspaceService.ts       ← NEW: fetchWorkspaceTree
  composables/
    useWorkspaceTree.ts       ← NEW: tree state + CRUD
  components/
    layout/
      FileTreePanel.vue       ← NEW (replaces SidebarTemplates.vue)
      FileTreeContextMenu.vue ← NEW
    editors/
      NewFileDialog.vue       ← NEW
```
