# Sprint 20 (Frontend) — Remove Obsolete Functionality

## Goal
Mirror the backend cleanup on the frontend. Remove all UI code that only exists to support
`Sections`/`Partial`/`FullClass` modes, bundle ZIP import/export, and any stale references to
the removed `/api/project` endpoint. Leave the codebase in a `.buelo`-only state.

## Status
`[x] done`

## Dependencies
- Sprint 20 backend complete — no more Sections mode; no ZIP endpoints
- Sprint 18 frontend complete — project route removed, format-at-creation

## Scope

- [x] **FE-20.1 — Remove `TemplateMode` values from frontend types** (`src/types/template.ts`)
  Update the `TemplateMode` union to remove all obsolete values:
  ```ts
  // Before
  export type TemplateMode = 'Sections' | 'Partial' | 'FullClass' | 'Builder' | 'BueloDsl'

  // After
  export type TemplateMode = 'BueloDsl'
  ```
  Remove all `switch`/`if` branches that handle the removed modes throughout the codebase:
  - `src/stores/reportStore.ts` — remove the `Partial` guard in `render()`
  - `src/composables/useActiveTemplate.ts` — remove `mode` from `seedFilesFromTemplate` if only
    used for `Sections`-specific file seeding (e.g. `template.report.cs` hardcoded node)
  - `src/composables/useWorkspaceTree.ts` — remove `inferKindFromExtension` returning
    `'template-sections'`; default all `.buelo` files to `'template'` kind

- [x] **FE-20.2 — Remove mode selector from template creation flow** (`src/components/editors/NewFileDialog.vue`)
  Remove any mode-related field or dropdown from the dialog. The only relevant field for a new
  `.buelo` file is `outputFormat` (added in Sprint 18-FE).

- [x] **FE-20.3 — Remove bundle export/import UI** (`src/components/editors/ArtefactTabs.vue`, or
  wherever export/import lives)
  Remove the **Export ZIP** and **Import ZIP** buttons/actions. Remove the corresponding service
  calls in `templateService.ts`:
  - `exportBundle(id)` → delete
  - `importBundle(file)` → delete

- [x] **FE-20.4 — Remove Sections-mode editor fallback in `TemplateEditor.vue`**
  If the component has a branch that renders a C# Monaco model (language `csharp`) when
  `TemplateMode.Sections` is active, remove that branch. All editor instances should now use
  the `buelo` language ID unconditionally.

- [x] **FE-20.5 — Remove hardcoded `template.report.cs` virtual file**
  File: `src/services/workspaceService.ts` (`buildTemplateChildren`) — the function currently adds
  a hardcoded `template.report.cs` node as a child of every template folder — this was the
  Sections-mode entry point. Remove it.

  File: `src/composables/useActiveTemplate.ts` — remove `TEMPLATE_FILE_PATH = 'template.report.cs'`
  constant and any code that treats that path as the default active path. The default active path
  for a `.buelo` template should now simply be `{templateName}.buelo` (the template root file itself).

  File: `src/components/editors/ArtefactTabs.vue` — remove the
  `v-show="effectiveActivePath === TEMPLATE_FILE_PATH"` guard for the template editor pane. The
  `.buelo` template is the main file — there is no separate `.cs` entrypoint.

- [x] **FE-20.6 — Remove `mock.data.json` hardcoded virtual file**
  File: `src/services/workspaceService.ts` (`buildTemplateChildren`) — the function adds a
  hardcoded `mock.data.json` node. This was the Sections-mode mock data convention. Remove it from
  auto-generated children; actual `.json` artefacts are discovered from the real template
  artefacts list.

- [x] **FE-20.7 — Remove stale `TemplateFileKind` values** (`src/types/template.ts`)
  ```ts
  // Before
  export type TemplateFileKind = 'template-sections' | 'data' | 'helper' | 'file'

  // After
  export type TemplateFileKind = 'data' | 'helper' | 'file'
  ```
  Update `inferKindFromExtension` in `useWorkspaceTree.ts`:
  ```ts
  function inferKindFromExtension(ext: string): TemplateFileKind {
    if (ext === '.cs' || ext === '.csx') return 'helper'
    if (ext === '.json') return 'data'
    return 'file'
  }
  ```

- [x] **FE-20.8 — Remove stale sprint references from `AppLayout` / router**
  If any component conditionally renders based on route `/project` (already removed in Sprint 18),
  clean up those conditions. Confirm the router no longer has any reference to `ProjectEditor`.

## Notes

Items deleted/removed as part of this sprint:

| Item | Action |
|------|--------|
| `templateService.exportBundle()` | delete method |
| `templateService.importBundle()` | delete method |
| `TemplateMode` union values `Sections \| Partial \| FullClass \| Builder` | remove |
| `TemplateFileKind` value `template-sections` | remove |
| Hardcoded `template.report.cs` virtual node | remove from `buildTemplateChildren` |
| Hardcoded `mock.data.json` virtual node | remove from `buildTemplateChildren` |
| `TEMPLATE_FILE_PATH` constant | remove if only used for `.cs` default path |
