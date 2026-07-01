# Sprint 5 (Frontend) — Template Management (Local State)

## Goal
Allow users to create, rename, delete, and select templates stored in `localStorage`. Selecting a
template loads its content into the Monaco editors.

## Status
`[x] done`

## Dependencies
- Sprint 2 (Monaco Editor) — complete (editors must accept external values)
- Pinia installed (from Sprint 3)

## Scope

- [x] **5.1 Define `Template` type** — `src/types/template.ts`
  ```ts
  export interface Template {
    id: string
    name: string
    template: string
    mockData: object
  }
  ```

- [x] **5.2 Create `useTemplateStore`** — `src/stores/templateStore.ts`

  State:
  ```ts
  templates: Template[]
  activeTemplateId: string | null
  ```

  Getters:
  ```ts
  activeTemplate: Template | null  // derived from activeTemplateId
  ```

  Actions:
  - `loadFromStorage()` — parse `localStorage.getItem('buelo:templates')`, fallback to `[]`
  - `persist()` — private helper, calls
    `localStorage.setItem('buelo:templates', JSON.stringify(templates))`
  - `createTemplate()` — generates UUID (`crypto.randomUUID()`), pushes default template, calls
    `persist()`
  - `updateTemplate(id, patch: Partial<Omit<Template, 'id'>>)` — merges patch, calls `persist()`
  - `deleteTemplate(id)` — removes from array, resets `activeTemplateId` if needed, calls
    `persist()`
  - `selectTemplate(id)` — sets `activeTemplateId`

  Call `loadFromStorage()` in the store `setup` entry (runs once when store is first used).

  Default template for `createTemplate()`:
  ```ts
  {
    name: 'New Template',
    template: 'Hello, {{ name }}!',
    mockData: { name: 'World' }
  }
  ```

- [x] **5.3 Update `SidebarTemplates.vue`** — `src/components/layout/SidebarTemplates.vue`
  - Use `useTemplateStore`
  - Render list of templates from `store.templates`
  - Each item: name shown as text (click to select); active item highlighted (shadcn `accent`
    background); hover reveals "Rename" and "Delete" icon buttons (lucide `Pencil`, `Trash2`)
  - Header "+" button calls `store.createTemplate()`
  - "Delete" button opens shadcn `AlertDialog` to confirm before deleting
  - "Rename" button opens a shadcn `Dialog` with an `Input` pre-filled with current name; on
    confirm, calls `store.updateTemplate(id, { name })`

- [x] **5.4 Create `useActiveTemplate` composable** — `src/composables/useActiveTemplate.ts`
  - Watches `store.activeTemplate`
  - When it changes: update `templateCode` ref and `jsonData` ref in editors
  - This composable bridges the store to the editors without tight coupling
  > Alternatively, handle directly in `ReportEditor/Index.vue` with a `watch` on
  > `store.activeTemplate` — choose the simpler approach.

- [x] **5.5 Update `pages/ReportEditor/Index.vue`**
  - Watch `store.activeTemplate`: set `templateCode` to `activeTemplate.template`; set `jsonData`
    to `JSON.stringify(activeTemplate.mockData, null, 2)`
  - On editor content change: call
    `store.updateTemplate(activeTemplateId, { template, mockData: parsedJson })`, debounced by
    500ms to avoid excessive writes

- [x] **5.6 Update `CodeEditorPanel.vue` props**
  - Accept `modelValue` props for both editors (or use store directly — prefer props for
    testability)
  - Emit change events upward

## Notes

File structure after sprint:
```
src/
  types/
    template.ts               ← new
  stores/
    templateStore.ts          ← new
  composables/
    useActiveTemplate.ts      ← new (optional)
  components/
    layout/
      SidebarTemplates.vue    ← updated
    editors/
      CodeEditorPanel.vue     ← updated
  pages/
    ReportEditor/
      Index.vue               ← updated
```

Acceptance criteria:
- [x] Templates persist across page reload (localStorage)
- [x] Creating a template adds it to the list and selects it
- [x] Selecting a template loads its code and JSON into editors
- [x] Renaming a template updates the sidebar label
- [x] Deleting shows confirmation dialog before removal
- [x] Editor changes are saved back to the active template (debounced)
- [x] No TypeScript errors (`pnpm typecheck`)
