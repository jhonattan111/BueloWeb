# Sprint 23 (Frontend) — Monaco IntelliSense + Report Settings Persistence

## Goal
Two tightly related improvements delivered together: (1) **Monaco C# IntelliSense for bound
data** — when the user selects a `.json` data source in Report Settings, fetch the C# type
declarations from the backend (`GET /api/workspace/types`) and inject them into Monaco as an extra
model so `data.` auto-complete works for the inferred property names; (2) **Report Settings
persistence fix** — replace `sessionStorage` with `localStorage` so all per-file settings
(especially `dataSourcePath`) survive full page reloads and browser restarts, and ensure settings
changes are immediately reflected in the next render without requiring a separate "apply" action.

## Status
`[x] done`

## Dependencies
- Sprint 22 backend complete (typed data endpoint `GET /api/workspace/types`)
- Sprint 22 frontend workspace UX complete — multi-tabs, data source picker

## Scope

In scope: Monaco C# completion provider for inferred data properties; type declaration injection
into Monaco as extra models; `localStorage` persistence for `useReportSettings`; reactive settings
auto-apply (watch-driven, no separate button needed); `dataSourcePath` auto-refresh on workspace
tree change.

Out of scope: full Roslyn LSP / OmniSharp integration; IntelliSense inside nested helper files
(`.cs`/`.csx`); IntelliSense for non-data-source completions (QuestPDF API surface); syncing
settings back into the `.cs` source text (no code injection).

- [x] **FE-23.1 — `workspaceService` — fetch type declarations** (`src/services/workspaceService.ts`)
  Added `fetchTypeDeclarations(path): Promise<{ path; csharpDeclarations } | null>` — calls
  `GET /api/workspace/types?path={path}`; returns `null` on `404` or if `path` is falsy / not
  `.json`; propagates non-404 errors as thrown exceptions.

- [x] **FE-23.2 — Monaco extra-model injection for C# type declarations**
  (`src/lib/buelo-language/csharpTypeInjector.ts`, new) — `injectDataTypeDeclarations(csharpSource)`
  manages a single extra model at a well-known URI (`inmemory://buelo/DataModel.cs`), creating it on
  first call and updating content on subsequent calls; disposes the model when passed null/empty;
  the injected model uses language `'csharp'` for syntax highlighting.

- [x] **FE-23.3 — Monaco completion provider for `data.` properties**
  (`src/lib/buelo-language/csharpDataCompletions.ts`, new) — registers a
  `CompletionItemProvider` for the `csharp` language triggered on `.`; offers
  `DataProperty.csharpName` completions of kind `Field` when preceded by `data.`; offers `data`
  itself as a variable completion when typed without `.`; clears completions when no data source
  is bound.

- [x] **FE-23.4 — `useReportSettings` — switch to `localStorage` + auto-apply**
  (`src/composables/useReportSettings.ts`)
  - Storage key: replaced `sessionStorage` with `localStorage` everywhere
  - Auto-apply: added a `watch`/`watchEffect` that persists settings whenever `settings.value`
    changes and `activePath.value` is non-empty, replacing the need for an explicit `apply()` call
  - Kept `apply()` for backwards compatibility, simplified to a no-op (settings already
    auto-persisted)
  - `canEdit` guard: verified it still works for the multi-tab model (already matched `.cs` files)

- [x] **FE-23.5 — Wire type declarations into `useReportSettings`** (extend
  `src/composables/useReportSettings.ts`) — when `settings.value.dataSourcePath` changes: calls
  `fetchTypeDeclarations`, then `injectDataTypeDeclarations` + `updateDataCompletions` if
  declarations are returned, or clears both if the path is cleared / fetch returns null. Added a
  private `parseProperties(source)` helper that extracts property names/types from the returned C#
  `record` declarations via regex (`/\bpublic record DataModel\(([^)]+)\)/`).

- [x] **FE-23.6 — Register completion provider and type injector at startup**
  (`src/main.ts` / `src/lib/buelo-language/index.ts`) — `registerDataCompletionProvider()` called
  once after Monaco is loaded; disposable stored and cleaned up on app unmount.

- [x] **FE-23.7 — `ProjectSettingsPanel` — remove explicit Apply button dependency**
  (`src/components/layout/ProjectSettingsPanel.vue`) — since settings now auto-persist via the
  watcher, the Apply button/`isSaving` spinner were removed; `saveError` display kept in case
  future server-side persistence operations can fail.

## Notes

Acceptance criteria:
1. Selecting a `.json` data source in Report Settings fetches type declarations from the backend
   and Monaco shows `data.PropertyName` completions for top-level properties.
2. Changing `dataSourcePath` to a different file updates completions without page reload.
3. Clearing the data source removes all injected completions.
4. All per-file settings (including `dataSourcePath`) survive a full page reload (`localStorage`).
5. Settings changes are reflected in the next render without clicking "Apply".
6. Nested `.json` objects produce named record types visible in Monaco's extra model (even if
   nested-property IntelliSense requires full LSP — the types are present).
