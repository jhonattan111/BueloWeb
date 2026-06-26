# Sprint 12 — Frontend: Live Diagnostics & Version History

## Goal
Connect the editor to the backend validate endpoint for real-time error squiggles. Add a version history panel that lets users browse snapshots and restore any previous version. Completes the frontend feature roadmap.

## Status
`[x] done`

## Dependencies
- Sprint 9 backend complete (validate + version endpoints available) ✅
- Sprint 11 frontend complete ✅

---

## Compatibility Notes from Backend Changes
- `POST /api/report/validate` returns `{ valid, errors: [{ message, line, column }] }`
- `GET /api/templates/{id}/versions` returns `[{ version, savedAt, savedBy }]`
- `GET /api/templates/{id}/versions/{n}` returns full snapshot
- `POST /api/templates/{id}/versions/{n}/restore` restores snapshot → creates new version
- `POST /api/report/render/{id}?version=N` renders historical snapshot

---

## Tasks

### 12.1 — `templateService.ts` additions

```ts
validateTemplate(template: string, mode: TemplateMode): Promise<ValidateResult>
listVersions(templateId: string): Promise<TemplateVersionMeta[]>
getVersion(templateId: string, version: number): Promise<TemplateVersionSnapshot>
restoreVersion(templateId: string, version: number): Promise<Template>
```

New types in `src/types/template.ts`:

```ts
export interface ValidateResult {
  valid: boolean
  errors: Array<{ message: string; line: number; column: number }>
}

export interface TemplateVersionMeta {
  version: number
  savedAt: string
  savedBy: string | null
}

export interface TemplateVersionSnapshot {
  version: number
  template: string
  artefacts: TemplateArtefact[]
  savedAt: string
}
```

### 12.2 — `useTemplateDiagnostics` composable

File: `src/composables/useTemplateDiagnostics.ts`

```ts
export function useTemplateDiagnostics(
  templateSource: MaybeRefOrGetter<string>,
  mode: MaybeRefOrGetter<TemplateMode>,
  monacoModel: MaybeRefOrGetter<monaco.editor.ITextModel | null>
): { isValidating: Ref<boolean>; hasErrors: Ref<boolean> }
```

Behavior:
- `watchEffect` on `templateSource` — debounce 1500ms before calling `validateTemplate`
- Activates for both `Sections` and `Partial` modes (the only two valid modes)
- On result: calls `monaco.editor.setModelMarkers(model, 'buelo', markers)`
- Sets `isValidating` during the request; clears markers on empty error list
- Cleans up markers on unmount

### 12.3 — Wire `useTemplateDiagnostics` in template editor

File: `src/components/editors/ArtefactTabs.vue` (or `TemplateEditor.vue`)

- Grab the Monaco model from the template tab editor
- Pass to `useTemplateDiagnostics`
- Show a status indicator (spinning / green check / red X) in the tab bar

### 12.4 — `VersionHistoryPanel.vue` component

File: `src/components/editors/VersionHistoryPanel.vue`

Collapsible side panel (or slide-over) triggered by a "History" button in the template editor toolbar:

- Loads `listVersions(templateId)` on open
- Shows a list: `Version {n} — {savedAt relative time}` (e.g. "3 hours ago")
- Clicking a version:
  - Fetches `getVersion(id, n)` and shows diff preview in a read-only Monaco editor (split view if space allows, otherwise single pane)
  - Shows "Restore this version" button
- Restore:
  - Calls `restoreVersion(id, n)`
  - Reloads the active template in the editor
  - Shows toast "Version {n} restored as version {n+1}"
- "Render version" button: opens preview panel using `POST /api/report/render/{id}?version=N`

### 12.5 — Preview from historical version

File: `src/stores/reportStore.ts`

Add optional `version` parameter to the render action:

```ts
async renderTemplate(templateId: string, version?: number): Promise<void>
```

`reportService.renderById(id, data?, version?)` appends `?version=N` to the URL when provided.

### 12.6 — Toolbar integration

File: `src/components/editors/` (template editor toolbar area)

Add to the editor toolbar:
- `[Validate]` button — triggers manual validate (shows spinner, then result toast)
- `[History]` button — toggles `VersionHistoryPanel`
- Diagnostic status icon: green check (valid) / red X (errors) / grey dash (not yet validated)

---

## Acceptance Criteria
- [ ] Errors from `/api/report/validate` appear as red squiggles in the Monaco editor within 2s of stopping typing
- [ ] Squiggles clear when template becomes valid
- [ ] Diagnostics only activate for `Sections` and `Partial` modes
- [ ] Version history panel opens and lists all saved versions
- [ ] Clicking a version shows its template content in read-only preview
- [ ] Restore overwrites active editor content and reloads artefact tabs
- [ ] "Render version" renders the historical snapshot in the PDF preview panel
- [ ] Manual Validate button works independently of the debounce
