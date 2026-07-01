# Sprint 22 (Frontend) — VS Code-like Workspace UX + Multi-tabs + Data Source Assignment

## Goal
Deliver a VS Code-like file experience where users can: create folders and files in a tree
(nested); open multiple files in tabs and switch back to `.buelo` after opening others; render from
an active `.buelo` file; assign an existing `.json` file as the test data source in Report
Settings; work without the `global artefact` concept; and understand/control imports from editor UX.

## Status
`[x] done`

## Dependencies
- Backend Sprint 21 complete (workspace filesystem + import resolution + render-by-path)

## Scope

In scope: tree CRUD UX (folders/files); multi-tab editor state with reopen behavior; report
settings data source picker; import assistance UX; removal of global artefact UI paths.

Out of scope: Git integration in file tree; drag-and-drop reorder of tabs; offline sync.

- [x] **FE-22.1 — Replace template/global tree with workspace tree model**
  Files: `src/types/workspace.ts`, `src/services/workspaceService.ts`,
  `src/composables/useWorkspaceTree.ts`, `src/components/layout/FileTreePanel.vue`,
  `src/components/layout/FileTreeNode.vue`, `src/components/layout/FileTreeContextMenu.vue`
  - Node model represents folders and files by path; supports nested folder rendering
  - Context menu actions: New Folder, New File, Rename, Delete
  - Selected node stays stable by path after refresh

- [x] **FE-22.2 — New file creation dialog with folder target + extension types**
  File: `src/components/editors/NewFileDialog.vue`
  - Allows target folder path selection
  - Allows explicit file types: `.buelo`, `.json`, `.cs`, `.csx`, generic file
  - Does not show or depend on `global artefact` options

- [x] **FE-22.3 — Remove global artefact UX and state coupling**
  Files: `src/composables/useActiveTemplate.ts`, `src/components/layout/SidebarTemplates.vue`,
  `src/pages/ReportEditor/Index.vue`, `src/services/workspaceService.ts`
  - Removed virtual `_global/*` file flow
  - Opening a file always means opening a workspace path
  - Previous global artefact actions removed or migrated

- [x] **FE-22.4 — Multi-tab editor model (open many files)**
  Files: `src/composables/useOpenEditors.ts` (new), `src/components/editors/ArtefactTabs.vue`,
  `src/components/editors/CodeEditorPanel.vue`
  - Ordered list of open file paths; open/switch/close tab
  - Preserves tab dirty state
  - Reopening a previously opened `.buelo` works even after opening `.json`/`.cs`
  - If active tab closes, nearest tab activates

- [x] **FE-22.5 — Render active `.buelo` file by path**
  Files: `src/stores/reportStore.ts`, `src/services/reportService.ts`,
  `src/components/editors/ArtefactTabs.vue`
  - Render action uses active tab path when extension is `.buelo`
  - Render button disabled for non-`.buelo` active tabs with clear tooltip
  - Format behavior stays compatible with output settings

- [x] **FE-22.6 — Report Settings: assign `.json` data source**
  Files: `src/components/layout/ProjectSettingsPanel.vue`,
  `src/composables/useReportSettings.ts` (new if needed), `src/services/workspaceService.ts`
  - Added field `Data source (.json)` in Report Settings
  - Lists selectable `.json` files from workspace tree
  - Persists selected path into `.buelo` report settings block
  - Shows invalid/missing selected file state

- [x] **FE-22.7 — Imports UX and editor assistance**
  Files: `src/lib/buelo-language/completions.ts`, `src/components/editors/TemplateEditor.vue`,
  `src/composables/useTemplateDiagnostics.ts`
  - Suggests path completions while typing import statements
  - Validates unresolved imports and surfaces diagnostics with file path
  - Optional quick action: create missing imported file
  - Follows backend rules (relative + workspace-root absolute imports)

- [x] **FE-22.8 — File properties pane (minimum metadata)**
  Files: `src/components/layout/FilePropertiesPanel.vue` (new), `src/pages/ReportEditor/Index.vue`
  - Displays selected node info: name, extension/type, full path, last modified (if available)
  - For `.buelo`, includes resolved data source path preview

## Notes

Acceptance criteria:
1. User can create folders and nested files in the tree (VS Code-like flow).
2. User can open multiple files in tabs and switch back to any `.buelo` tab.
3. Render works from active `.buelo` file path.
4. Report Settings allows choosing an existing `.json` as data source.
5. Import workflow is clear (autocomplete + diagnostics for unresolved imports).
6. No mandatory use of global artefact concept remains in UX.

Validation: mandatory checks after implementation were `pnpm typecheck` and targeted
component/composable tests.
