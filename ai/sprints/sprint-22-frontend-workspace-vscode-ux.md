# Sprint 22 (Frontend) - VS Code-like Workspace UX + Multi-tabs + Data Source Assignment

## Goal

Deliver a VS Code-like file experience where users can:

1. create folders and files in a tree (nested)
2. open multiple files in tabs and switch back to `.buelo` after opening others
3. render from an active `.buelo` file
4. assign an existing `.json` file as the test data source in Report Settings
5. work without the `global artefact` concept
6. understand and control imports from editor UX

## Status

`[x] done`

## Dependencies

- Backend Sprint 21 complete (workspace filesystem + import resolution + render-by-path)

---

## Scope

### In scope

- Tree CRUD UX (folders/files)
- Multi-tab editor state with reopen behavior
- Report settings data source picker
- Import assistance UX
- Removal of global artefact UI paths

### Out of scope

- Git integration in file tree
- Drag-and-drop reorder of tabs
- Offline sync

---

## Tasks

### FE-22.1 - Replace template/global tree with workspace tree model

Files:

- `src/types/workspace.ts`
- `src/services/workspaceService.ts`
- `src/composables/useWorkspaceTree.ts`
- `src/components/layout/FileTreePanel.vue`
- `src/components/layout/FileTreeNode.vue`
- `src/components/layout/FileTreeContextMenu.vue`

Changes:

- Node model must represent folders and files by path.
- Support nested folder rendering.
- Context menu actions:
  - New Folder
  - New File
  - Rename
  - Delete
- Keep selected node stable by path after refresh.

---

### FE-22.2 - New file creation dialog with folder target + extension types

Files:

- `src/components/editors/NewFileDialog.vue`

Requirements:

- Allow target folder path selection.
- Allow explicit file types:
  - `.buelo`
  - `.json`
  - `.cs`
  - `.csx`
  - generic file
- Do not show or depend on `global artefact` options.

---

### FE-22.3 - Remove global artefact UX and state coupling

Files:

- `src/composables/useActiveTemplate.ts`
- `src/components/layout/SidebarTemplates.vue`
- `src/pages/ReportEditor/Index.vue`
- `src/services/workspaceService.ts`

Changes:

- Remove virtual `_global/*` file flow.
- Opening a file always means opening a workspace path.
- Any previous global artefact actions should be removed or migrated.

---

### FE-22.4 - Multi-tab editor model (open many files)

Files:

- `src/composables/useOpenEditors.ts` (new)
- `src/components/editors/ArtefactTabs.vue`
- `src/components/editors/CodeEditorPanel.vue`

Requirements:

- Keep an ordered list of open file paths.
- Allow open/switch/close tab.
- Preserve tab dirty state.
- Reopening a previously opened `.buelo` must work even after opening `.json`/`.cs`.
- If active tab closes, activate nearest tab.

---

### FE-22.5 - Render active `.buelo` file by path

Files:

- `src/stores/reportStore.ts`
- `src/services/reportService.ts`
- `src/components/editors/ArtefactTabs.vue`

Changes:

- Render action should use active tab path when extension is `.buelo`.
- Disable render button for non-`.buelo` active tabs with clear tooltip.
- Keep format behavior compatible with output settings.

---

### FE-22.6 - Report Settings: assign `.json` data source

Files:

- `src/components/layout/ProjectSettingsPanel.vue`
- `src/composables/useReportSettings.ts` (new if needed)
- `src/services/workspaceService.ts`

Requirements:

- Add field `Data source (.json)` in Report Settings.
- List selectable `.json` files from workspace tree.
- Persist selected path into `.buelo` report settings block.
- Show invalid/missing selected file state.

---

### FE-22.7 - Imports UX and editor assistance

Files:

- `src/lib/buelo-language/completions.ts`
- `src/components/editors/TemplateEditor.vue`
- `src/composables/useTemplateDiagnostics.ts`

Requirements:

- Suggest path completions while typing import statements.
- Validate unresolved imports and surface diagnostics with file path.
- Optional quick action: create missing imported file.
- Follow backend rules (relative + workspace-root absolute imports).

---

### FE-22.8 - File properties pane (minimum metadata)

Files:

- `src/components/layout/FilePropertiesPanel.vue` (new)
- `src/pages/ReportEditor/Index.vue`

Requirements:

- Display selected node info:
  - name
  - extension/type
  - full path
  - last modified (if available)
- For `.buelo`, include resolved data source path preview.

---

## Acceptance Criteria

1. User can create folders and nested files in the tree (VS Code-like flow).
2. User can open multiple files in tabs and switch back to any `.buelo` tab.
3. Render works from active `.buelo` file path.
4. Report Settings allows choosing an existing `.json` as data source.
5. Import workflow is clear (autocomplete + diagnostics for unresolved imports).
6. No mandatory use of global artefact concept remains in UX.

---

## Validation

Mandatory checks after implementation:

- `pnpm typecheck`
- targeted component/composable tests if available
