# Sprint 23 (Frontend) — Monaco IntelliSense + Report Settings Persistence

## Goal

Two tightly related improvements delivered together:

1. **Monaco C# IntelliSense for bound data** — when the user selects a `.json` data source in
   Report Settings, fetch the C# type declarations from the backend (`GET /api/workspace/types`)
   and inject them into Monaco as an extra model so `data.` auto-complete works for the inferred
   property names.

2. **Report Settings persistence fix** — replace `sessionStorage` with `localStorage` so all
   per-file settings (especially `dataSourcePath`) survive full page reloads and browser restarts.
   Also ensure settings changes are immediately reflected in the next render without requiring a
   separate "apply" action.

## Status

`[ ] planned`

## Dependencies

- Sprint 22 backend complete (typed data endpoint `GET /api/workspace/types`)
- Sprint 22 frontend workspace UX complete ✅ (multi-tabs, data source picker)

---

## Scope

### In scope

- Monaco C# completion provider for inferred data properties
- Type declaration injection into Monaco as extra models
- `localStorage` persistence for `useReportSettings`
- Reactive settings auto-apply (watch-driven, no separate button needed)
- `dataSourcePath` auto-refresh on workspace tree change

### Out of scope

- Full Roslyn LSP / OmniSharp integration
- IntelliSense inside nested helper files (`.cs`/`.csx`)
- IntelliSense for non-data-source completions (QuestPDF API surface)
- Syncing settings back into the `.cs` source text (no code injection)

---

## Tasks

### FE-23.1 — `workspaceService` — fetch type declarations

**File:** `src/services/workspaceService.ts` (extend)

Add a new service function:

```ts
/**
 * Fetches inferred C# type declarations for a JSON file at the given workspace path.
 * Returns null if the path is empty, missing, or not a .json file.
 */
export async function fetchTypeDeclarations(
  path: string,
): Promise<{ path: string; csharpDeclarations: string } | null>
```

- Calls `GET /api/workspace/types?path={path}`.
- Returns `null` on `404` or if `path` is falsy / not `.json`.
- Propagates non-404 errors as thrown exceptions so callers can surface them.

---

### FE-23.2 — Monaco extra-model injection for C# type declarations

**File:** `src/lib/buelo-language/csharpTypeInjector.ts` (new)

```ts
import * as monaco from 'monaco-editor'

const INJECTED_MODEL_URI = 'inmemory://buelo/DataModel.cs'

/**
 * Injects C# type declarations into Monaco as a read-only extra model.
 * Creates the model on first call; subsequent calls update the content.
 * Pass null/empty string to clear previously injected declarations.
 */
export function injectDataTypeDeclarations(csharpSource: string | null): void
```

Implementation notes:
- Use `monaco.editor.getModel(uri)` / `monaco.editor.createModel()` to manage a single extra
  model at the well-known URI.
- When `csharpSource` is null or empty, dispose the existing model if present.
- The injected model must use language `'csharp'` so Monaco syntax-highlights it (even if not
  directly visible to the user).

---

### FE-23.3 — Monaco completion provider for `data.` properties

**File:** `src/lib/buelo-language/csharpDataCompletions.ts` (new)

Register a `monaco.languages.CompletionItemProvider` for the `csharp` language that triggers on
`.` after a word boundary (trigger character `.`):

```ts
export function registerDataCompletionProvider(): monaco.IDisposable

export function updateDataCompletions(properties: DataProperty[]): void

export interface DataProperty {
  name: string       // camelCase JSON key (as written in JSON)
  csharpName: string // PascalCase inferred C# name
  type: string       // inferred C# type string (e.g. "string", "int", "EmployeesItem[]")
}
```

Behaviour:
- When the cursor is preceded by `data.` (case-insensitive), offer `DataProperty.csharpName`
  completions of kind `Field`.
- Each item detail should show the inferred C# type.
- When `data` is typed without `.`, offer `data` itself as a variable completion with
  documentation `"Bound data from the selected .json data source"`.
- When no data source is bound, clear completions (empty array).

---

### FE-23.4 — `useReportSettings` — switch to `localStorage` + auto-apply

**File:** `src/composables/useReportSettings.ts`

Changes:

1. **Storage key** — replace `sessionStorage` with `localStorage` everywhere:

   ```ts
   // before
   sessionStorage.getItem(STORAGE_KEY)
   sessionStorage.setItem(STORAGE_KEY, ...)

   // after
   localStorage.getItem(STORAGE_KEY)
   localStorage.setItem(STORAGE_KEY, ...)
   ```

2. **Auto-apply** — add a `watchEffect` (or `watch` with `deep: true`) that persists settings
   whenever `settings.value` changes and `activePath.value` is non-empty, replacing the need for
   an explicit `apply()` call:

   ```ts
   watch(
     [activePath, settings],
     ([path]) => {
       if (!path) return
       perFileSettings.value = new Map(perFileSettings.value)
       perFileSettings.value.set(path, { ...settings.value })
       persistSettings()
     },
     { deep: true },
   )
   ```

3. **Keep `apply()`** for backwards compatibility but simplify it to a no-op (settings are already
   auto-persisted):

   ```ts
   async function apply(): Promise<void> {
     // no-op: auto-persisted by watcher
   }
   ```

4. **`canEdit` guard** — extend to also match `.cs` files (no change needed; already done):
   verify the guard still works for the multi-tab model.

---

### FE-23.5 — Wire type declarations into `useReportSettings`

**File:** `src/composables/useReportSettings.ts` (extend)

When `settings.value.dataSourcePath` changes for the active file:
1. Call `fetchTypeDeclarations(dataSourcePath)`.
2. If declarations are returned, call `injectDataTypeDeclarations(csharpDeclarations)` and
   `updateDataCompletions(parseProperties(csharpDeclarations))`.
3. If path is cleared or fetch returns null, call `injectDataTypeDeclarations(null)` and
   `updateDataCompletions([])`.

Add a private helper `parseProperties(source: string): DataProperty[]` that extracts property
names and types from the returned C# `record` declarations using a simple regex:

```
/\bpublic record DataModel\(([^)]+)\)/
```

Parse each comma-separated parameter as `Type Name` → `{ csharpName: Name, type: Type, name: lowerFirst(Name) }`.

---

### FE-23.6 — Register completion provider and type injector at startup

**File:** `src/main.ts` (extend) or `src/lib/buelo-language/index.ts`

Call `registerDataCompletionProvider()` once after Monaco is loaded. The disposable should be
stored and cleaned up if the app unmounts (unlikely in SPA, but correct).

```ts
// in registerBueloLanguage() or equivalent startup hook
registerDataCompletionProvider()
```

---

### FE-23.7 — `ProjectSettingsPanel` — remove explicit Apply button dependency

**File:** `src/components/layout/ProjectSettingsPanel.vue`

Since settings now auto-persist via the watcher:
- The Apply button can be removed **or** kept as a visual indicator ("Settings saved ✓") using
  a brief toast/notification.
- Remove the `isSaving` spinner if the button is removed.
- Keep `saveError` display in case future operations (e.g., server-side persist) can fail.

---

## Acceptance Criteria

1. Selecting a `.json` data source in Report Settings fetches type declarations from the backend
   and Monaco shows `data.PropertyName` completions for top-level properties.
2. Changing `dataSourcePath` to a different file updates completions without page reload.
3. Clearing the data source removes all injected completions.
4. All per-file settings (including `dataSourcePath`) survive a full page reload (`localStorage`).
5. Settings changes are reflected in the next render without clicking "Apply".
6. Nested `.json` objects produce named record types visible in Monaco's extra model (even if
   nested-property IntelliSense requires full LSP — the types are present).

---
