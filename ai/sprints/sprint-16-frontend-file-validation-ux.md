# Sprint 16 (Frontend) — Per-File Validation UX

## Goal
Show real-time validation diagnostics for every file type in the workspace. Each editor tab displays inline Monaco squiggles based on its file extension. `.buelo` and `.cs`/`.csx` files validate against the backend. `.json` files use Monaco's built-in JSON validation (no network request). A status bar at the bottom of each editor shows the error/warning count and severity level.

## Status
`[ ] pending`

## Dependencies
- Sprint 16 backend complete ✅ (`POST /api/validate` endpoint with per-extension routing)
- Sprint 13 frontend complete ✅ (file tree + editor routing per extension)
- Sprint 14 frontend complete ✅ (`.buelo` Monaco language registered)
- Sprint 12 frontend complete ✅ (`useTemplateDiagnostics` pattern established)

---

## Compatibility Notes from Backend Changes
- `POST /api/validate` body: `{ extension: string, content: string }`
- Response: `{ valid: boolean, errors: ValidationDiagnostic[], warnings: ValidationDiagnostic[] }`
- `ValidationDiagnostic`: `{ message, line, column, severity: 'error'|'warning'|'info' }`
- Endpoint always returns 200, even when content has errors

---

## Tasks

### FE-16.1 — Update `src/types/template.ts`

Add validation types:

```ts
export interface FileValidationResult {
  valid: boolean
  errors: ValidationDiagnostic[]
  warnings: ValidationDiagnostic[]
}

export interface ValidationDiagnostic {
  message: string
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
}
```

---

### FE-16.2 — `validateService.ts`

File: `src/services/validateService.ts` (new file)

```ts
export async function validateFile(
  extension: string,
  content: string
): Promise<FileValidationResult>
```

Posts to `POST /api/validate`. For `.json` extension, skips the network call entirely — returns `{ valid: true, errors: [], warnings: [] }` (Monaco handles JSON natively).

---

### FE-16.3 — `useFileValidation` composable

File: `src/composables/useFileValidation.ts` (new file)

```ts
export function useFileValidation(
  content: MaybeRefOrGetter<string>,
  extension: MaybeRefOrGetter<string>,
  monacoModel: MaybeRefOrGetter<monaco.editor.ITextModel | null>
): {
  isValidating: Ref<boolean>
  result: Ref<FileValidationResult | null>
  hasErrors: Ref<boolean>
  errorCount: Ref<number>
  warningCount: Ref<number>
}
```

Behavior:
- `watchEffect` on `content` and `extension` (via `toValue()`)
- Debounce: 1200ms before calling `validateFile`
- Skip validation if `extension === '.json'` (Monaco handles it natively); still count Monaco's own markers via `monaco.editor.getModelMarkers({ owner: 'json' })`
- On result: call `monaco.editor.setModelMarkers(model, 'buelo-validate', markers)` with mapped markers
- `isValidating`: true during the request
- Marker mapping:
  ```ts
  const markers = [...result.errors, ...result.warnings].map(d => ({
    severity: d.severity === 'error'   ? monaco.MarkerSeverity.Error
             : d.severity === 'warning' ? monaco.MarkerSeverity.Warning
             :                            monaco.MarkerSeverity.Info,
    message:   d.message,
    startLineNumber: d.line,
    startColumn:     d.column,
    endLineNumber:   d.line,
    endColumn:       d.column + 10,  // highlight ~10 chars at error site
  }))
  ```
- Cleanup: clear markers with `setModelMarkers(model, 'buelo-validate', [])` on unmount

---

### FE-16.4 — Wire `useFileValidation` in `ArtefactEditorTab.vue`

File: `src/components/editors/ArtefactEditorTab.vue`

- Obtain the Monaco model from the editor instance
- Call `useFileValidation(content, extension, model)` 
- Pass `{ isValidating, hasErrors, errorCount, warningCount }` down to `EditorStatusBar` (see 16.5)
- Remove old `useTemplateDiagnostics` wiring for template tab — migrate to `useFileValidation` (same underlying logic, unified API)

---

### FE-16.5 — `EditorStatusBar.vue` component

File: `src/components/editors/EditorStatusBar.vue` (new file)

Displayed at the bottom of every editor tab. Shows:

| State | Display |
|-------|---------|
| Validating | Spinner + "Validating…" |
| No errors | ✓ "No problems" (green) |
| Warnings only | ⚠ "2 warnings" (yellow) |
| Errors | ✗ "3 errors, 1 warning" (red) |
| `.json` file | Monaco built-in error count via markers API |

Props:
```ts
{
  isValidating: boolean
  errorCount: number
  warningCount: number
  extension: string
  language: string
  lineCount: number
  cursorLine: number
  cursorColumn: number
}
```

Also shows (right side): language name, line/column indicator (e.g., "Ln 12, Col 5").

Clicking the error/warning count → scrolls Monaco to the first error marker.

---

### FE-16.6 — File tree error badges

File: `src/components/layout/FileTreePanel.vue` (addition)

For each file node in the tree, show a small colored dot/badge if the file has validation errors:
- Red dot: has errors
- Yellow dot: has warnings only
- No dot: clean

State management: `useWorkspaceTree` exposes a `validationState: Map<string, FileValidationResult>` reactive map. `useFileValidation` updates this map whenever a file is validated.

---

### FE-16.7 — Validation summary panel

File: `src/components/editors/ValidationSummaryPanel.vue` (new)

Collapsible panel at the bottom of the editor area (like VSCode's "Problems" panel):

- Lists all files with errors/warnings
- Each row: file name, error count badge, first error message
- Clicking a row → opens that file in the editor and scrolls to the error line
- Toggle button in the status bar area: "Problems (5)" badge

---

## Final file structure additions

```
src/
  services/
    validateService.ts              ← NEW
  composables/
    useFileValidation.ts            ← NEW (supersedes useTemplateDiagnostics for general use)
  components/
    editors/
      EditorStatusBar.vue           ← NEW
      ValidationSummaryPanel.vue    ← NEW
```
