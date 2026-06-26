# Sprint 15 (Frontend) — Project File Editor

## Goal
Provide a dedicated visual editor for the `project.bueloproject` file. Opening the project file from the file tree shows a settings panel (not a code editor) with forms for global page settings, global mock data, and project metadata. Settings persist to the backend `/api/project` endpoint and cascade as defaults for all templates.

## Status
`[ ] pending`

## Dependencies
- Sprint 15 backend complete ✅ (`/api/project` GET/PUT/PATCH endpoints available)
- Sprint 13 frontend complete ✅ (file tree opens `.bueloproject` node → routes to this editor)

---

## Compatibility Notes from Backend Changes
- `GET /api/project` → `BueloProject` object
- `PUT /api/project` → full replace
- `PATCH /api/project/page-settings` → partial page settings update
- `PATCH /api/project/mock-data` → partial mock data update
- `GET /api/project/reset` → returns factory defaults

---

## Tasks

### FE-15.1 — `projectService.ts`

File: `src/services/projectService.ts` (new file)

```ts
export interface BueloProject {
  name: string
  description: string | null
  version: string
  pageSettings: PageSettings
  mockData: unknown
  defaultOutputFormat: 'pdf' | 'excel'
  createdAt: string
  updatedAt: string
}

export interface PageSettings {
  pageSize: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal'
  marginHorizontal: number
  marginVertical: number
  backgroundColor: string
  defaultTextColor: string
  defaultFontSize: number
  showHeader: boolean
  showFooter: boolean
  watermarkText: string | null
}

export async function getProject(): Promise<BueloProject>
export async function updateProject(project: BueloProject): Promise<BueloProject>
export async function updatePageSettings(settings: Partial<PageSettings>): Promise<BueloProject>
export async function updateMockData(data: unknown): Promise<BueloProject>
export async function resetProject(): Promise<BueloProject>
```

---

### FE-15.2 — `projectStore.ts` — Pinia store

File: `src/stores/projectStore.ts` (new file)

```ts
export const useProjectStore = defineStore('project', () => {
  const project = ref<BueloProject | null>(null)
  const isLoading = ref(false)
  const isDirty = ref(false)

  async function load(): Promise<void>
  async function save(): Promise<void>             // PUT full project
  async function savePageSettings(): Promise<void> // PATCH page settings
  async function saveMockData(): Promise<void>     // PATCH mock data
  async function reset(): Promise<void>            // GET /reset then reload

  return { project, isLoading, isDirty, load, save, savePageSettings, saveMockData, reset }
})
```

`isDirty`: set to `true` on any local change; cleared on successful save.  
Unsaved changes prompt: if `isDirty` and user navigates away, show confirmation dialog.

---

### FE-15.3 — `ProjectEditor.vue` page

File: `src/pages/ProjectEditor/Index.vue` (new file)

Layout: three-tab panel

**Tab 1 — Metadata**:
- Project name (text input)
- Description (textarea)
- Version (text input, `x.y.z` pattern)
- Default output format (select: PDF | Excel)
- Created at / Updated at (read-only timestamps)

**Tab 2 — Page Settings**:
- Page size (select: A4, A3, A5, Letter, Legal) with a visual size preview badge
- Margin horizontal (number input + cm label)
- Margin vertical (number input + cm label)
- Background color (color picker input + hex text field)
- Default text color (color picker + hex)
- Default font size (number input + pt label, range: 6–72)
- Show header (toggle switch)
- Show footer (toggle switch)
- Watermark text (text input, optional; clear button)

Visual preview: a small A4-shaped card that reflects the current settings (border, background, font size indicator). Updates live as settings change.

**Tab 3 — Global Mock Data**:
- Monaco editor with `language: 'json'` for `project.mockData`
- "Validate JSON" button → calls `POST /api/validate` with `extension: '.json'`
- Error banner if JSON is invalid
- "Copy to clipboard" button

**Footer actions** (sticky):
- **Save** (primary) — calls `save()`
- **Reset to defaults** (secondary, destructive confirm) — calls `reset()`
- Dirty indicator: unsaved dot next to "Save" when `isDirty`

---

### FE-15.4 — Color picker sub-component

File: `src/components/ui/ColorPickerInput.vue` (new)

Props: `modelValue: string` (hex), `label: string`  
Emits: `update:modelValue`

Visual: native `<input type="color">` + text field showing hex value. Synced bidirectionally.  
Validates: must be a valid 6-digit hex string; shows red border if invalid.

---

### FE-15.5 — Page size preview card

File: `src/components/ui/PageSizePreview.vue` (new)

Props: `settings: PageSettings`

Renders a scaled-down rectangle (aspect ratio matching the selected page size) with:
- Background color from `settings.backgroundColor`
- Border
- Small text sample at `settings.defaultFontSize / 2` (px, for the preview)
- "H" indicator bar at top if `showHeader` is true
- "F" indicator bar at bottom if `showFooter` is true
- Watermark text overlaid diagonally if `watermarkText` is set

Page size aspect ratios: A4 = 1:√2, Letter = 8.5:11, Legal = 8.5:14, A3 = 1:√2 (wider), A5 = 1:√2 (smaller).

---

### FE-15.6 — Router integration

File: `src/router/index.ts`

Add route:
```ts
{
  path: '/project',
  name: 'project',
  component: () => import('@/pages/ProjectEditor/Index.vue')
}
```

File: `src/components/layout/FileTreePanel.vue`

When project file node is clicked → `router.push('/project')`.

---

### FE-15.7 — Project settings badge in header

File: `src/components/layout/AppLayout.vue` (small addition)

Add a gear icon button in the top-right area of the app header that navigates to `/project`. Tooltip: "Project Settings".

---

## Final file structure additions

```
src/
  services/
    projectService.ts           ← NEW
  stores/
    projectStore.ts             ← NEW
  pages/
    ProjectEditor/
      Index.vue                 ← NEW
  components/
    ui/
      ColorPickerInput.vue      ← NEW
      PageSizePreview.vue       ← NEW
```
