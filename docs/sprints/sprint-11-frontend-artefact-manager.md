# Sprint 11 — Frontend: Artefact Manager & Template Bundle UI

## Goal
Expose the multi-artefact model in the UI. Each template can now have associated files (mock data, schema, helpers). The editor panel evolves into a tabbed interface: one tab for the template source, additional tabs for artefacts. Add artefact CRUD interactions and wire the export/import bundle feature.

## Status
`[x] done`

## Dependencies
- Sprint 8 backend complete (artefact endpoints available) ✅
- Sprint 10 frontend complete ✅

---

## Compatibility Notes from Backend Changes
- `TemplateRecord` now has `artefacts: TemplateArtefact[]`
- New endpoints: `GET/PUT/DELETE /api/templates/{id}/artefacts/{name}`
- `GET /api/templates/{id}/export` → `.zip`
- `POST /api/templates/import` → multipart

---

## Tasks

### 11.1 — Update `src/types/template.ts`

Add new types reflecting backend changes:

```ts
export interface TemplateArtefact {
  name: string
  extension: string
  content: string
}

export interface Template {
  // existing fields ...
  artefacts: TemplateArtefact[]
}
```

### 11.2 — Update `templateService.ts`

Add artefact service methods:

```ts
listArtefacts(templateId: string): Promise<Pick<TemplateArtefact, 'name' | 'extension'>[]>
getArtefact(templateId: string, name: string): Promise<TemplateArtefact>
upsertArtefact(templateId: string, artefact: TemplateArtefact): Promise<void>
deleteArtefact(templateId: string, name: string): Promise<void>
exportBundle(templateId: string): Promise<Blob>        // returns zip blob
importBundle(file: File): Promise<Template>
```

### 11.3 — Artefact tab model in `useActiveTemplate`

File: `src/composables/useActiveTemplate.ts`

New state:

```ts
const artefacts = ref<TemplateArtefact[]>([])
const activeArtefactName = ref<string | null>(null)

async function loadArtefacts(): Promise<void>
async function saveArtefact(artefact: TemplateArtefact): Promise<void>
async function removeArtefact(name: string): Promise<void>
```

### 11.4 — `ArtefactTabs.vue` component

File: `src/components/editors/ArtefactTabs.vue`

Tabbed panel above or alongside the existing code editor:

- First tab: **Template** (main `.report.cs` source) — uses `buelo` language
- Dynamic tabs: one per artefact, labeled `{name}{extension}`
  - `.json` artefacts → Monaco with `language: 'json'`
  - `.cs` / `.helpers.cs` artefacts → Monaco with `language: 'csharp'`
  - `.schema.json` → Monaco with `language: 'json'`
- Tab actions:
  - `+` button → opens `AddArtefactDialog`
  - `×` on each artefact tab → `deleteArtefact` after confirm dialog
- Auto-saves artefact content 1s after last keystroke (debounce)

### 11.5 — `AddArtefactDialog.vue`

File: `src/components/editors/AddArtefactDialog.vue`

Dialog with fields:
- **Name** (text input, slug-validated: lowercase, hyphens only)
- **Type** (select):
  - `Mock Data (.data.json)` → extension `.data.json`
  - `Schema (.schema.json)` → extension `.schema.json`
  - `Helpers (.helpers.cs)` → extension `.helpers.cs`
  - `Custom (.cs)` → extension `.cs`
- On confirm: calls `upsertArtefact` with empty content, then opens the new tab

### 11.6 — Bundle Export / Import UI

File: `src/components/layout/SidebarTemplates.vue` (context menu) or template detail header

Export:
- Context menu item "Export bundle (.zip)" on each template in sidebar
- Calls `templateService.exportBundle(id)`, triggers browser download via `<a href=URL download>`

Import:
- Button "Import bundle" in sidebar header
- Opens file picker (`.zip` only)
- Calls `templateService.importBundle(file)`, reloads template list on success, navigates to imported template

### 11.7 — Update `TemplateEditor.vue` to use `ArtefactTabs`

Replace the single Monaco editor with `ArtefactTabs`. The JSON data panel (mock data) remains only if no `.data.json` artefact is attached — otherwise the artefact tab replaces it.

---

## Acceptance Criteria
- [ ] Active template shows tabs: Template + one tab per artefact
- [ ] Adding an artefact via dialog creates it in the backend and opens the new tab
- [ ] Closing an artefact tab (×) shows confirm dialog before deleting
- [ ] Content changes in artefact tabs auto-save (debounced)
- [ ] `.json` artefacts use JSON Monaco language; `.cs` artefacts use csharp
- [ ] Export downloads a `.zip` containing all artefacts
- [ ] Import from `.zip` creates template + artefacts, navigates to it
- [ ] Mock data panel is hidden when a `.data.json` artefact is present
