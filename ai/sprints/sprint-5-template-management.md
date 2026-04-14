# Sprint 5 — Template Management (Local State)

## Goal
Allow users to create, rename, delete, and select templates stored in `localStorage`. Selecting a template loads its content into the Monaco editors.

## Status
`[x] done`

## Dependencies
- Sprint 2 complete ✅ (editors must accept external values)
- Pinia installed ✅ (from Sprint 3)

## Tasks

### 5.1 Define `Template` type
File: `src/types/template.ts`

```ts
export interface Template {
  id: string
  name: string
  template: string
  mockData: object
}
```

### 5.2 Create `useTemplateStore`
File: `src/stores/templateStore.ts`

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
- `persist()` — private helper, calls `localStorage.setItem('buelo:templates', JSON.stringify(templates))`
- `createTemplate()` — generates UUID (`crypto.randomUUID()`), pushes default template, calls `persist()`
- `updateTemplate(id, patch: Partial<Omit<Template, 'id'>>)` — merges patch, calls `persist()`
- `deleteTemplate(id)` — removes from array, resets `activeTemplateId` if needed, calls `persist()`
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

### 5.3 Update `SidebarTemplates.vue`
File: `src/components/layout/SidebarTemplates.vue`

- Use `useTemplateStore`
- Render list of templates from `store.templates`
- Each item:
  - Name shown as text (click to select)
  - Active item highlighted (shadcn `accent` background)
  - Hover reveals "Rename" and "Delete" icon buttons (lucide `Pencil`, `Trash2`)
- Header "+" button calls `store.createTemplate()`
- "Delete" button opens shadcn `AlertDialog` to confirm before deleting
- "Rename" button opens a shadcn `Dialog` with an `Input` pre-filled with current name; on confirm, calls `store.updateTemplate(id, { name })`

### 5.4 Create `useActiveTemplate` composable
File: `src/composables/useActiveTemplate.ts`

- Watches `store.activeTemplate`
- When it changes: update `templateCode` ref and `jsonData` ref in editors
- This composable bridges the store to the editors without tight coupling

> Alternatively, handle directly in `ReportEditor/Index.vue` with a `watch` on `store.activeTemplate` — choose the simpler approach.

### 5.5 Update `pages/ReportEditor/Index.vue`
- Watch `store.activeTemplate`:
  - Set `templateCode` to `activeTemplate.template`
  - Set `jsonData` to `JSON.stringify(activeTemplate.mockData, null, 2)`
- On editor content change: call `store.updateTemplate(activeTemplateId, { template, mockData: parsedJson })`
  - Debounce updates by 500ms to avoid excessive writes

### 5.6 Update `CodeEditorPanel.vue` props
- Accept `modelValue` props for both editors (or use store directly — prefer props for testability)
- Emit change events upward

## File Structure After Sprint
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

## Acceptance Criteria
- [ ] Templates persist across page reload (localStorage)
- [ ] Creating a template adds it to the list and selects it
- [ ] Selecting a template loads its code and JSON into editors
- [ ] Renaming a template updates the sidebar label
- [ ] Deleting shows confirmation dialog before removal
- [ ] Editor changes are saved back to the active template (debounced)
- [ ] No TypeScript errors (`pnpm typecheck`)
