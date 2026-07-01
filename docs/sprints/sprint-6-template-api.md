# Sprint 6 (Frontend) — Template Backend API

## Goal
Replace `localStorage` persistence with backend API calls. The store interface stays the same;
only the persistence layer changes.

## Status
`[x] done`

## Dependencies
- Sprint 5 (Template Management, Local State) — complete
- Backend endpoints available:
  - `GET    /api/templates`
  - `POST   /api/templates`
  - `PUT    /api/templates/{id}`
  - `DELETE /api/templates/{id}`

## Scope

- [x] **6.1 Create `templateService.ts`** — `src/services/templateService.ts`

  All functions use `fetch` with base URL from `import.meta.env.VITE_API_BASE_URL`.
  ```ts
  listTemplates(): Promise<Template[]>
  getTemplate(id: string): Promise<Template>
  createTemplate(payload: Omit<Template, 'id'>): Promise<Template>
  updateTemplate(id: string, payload: Partial<Omit<Template, 'id'>>): Promise<Template>
  deleteTemplate(id: string): Promise<void>
  ```
  Error handling: on non-2xx response, throw `new Error(await response.text())` so callers get a
  meaningful message; no retry logic.

- [x] **6.2 Update `useTemplateStore`** — `src/stores/templateStore.ts`

  Replace localStorage calls with service calls:

  | Old (local) | New (API) |
  |---|---|
  | `loadFromStorage()` | `fetchTemplates()` — calls `listTemplates()`, sets `templates` |
  | `createTemplate()` | calls `templateService.createTemplate(...)`, pushes result |
  | `updateTemplate(id, patch)` | calls `templateService.updateTemplate(id, patch)`, merges result |
  | `deleteTemplate(id)` | calls `templateService.deleteTemplate(id)`, removes from array |

  New state:
  ```ts
  isLoading: boolean
  error: string | null
  ```
  - Set `isLoading = true` before any async action, `false` after
  - Set `error` on failure, clear on new action start
  - Remove all `localStorage` references

  Call `fetchTemplates()` in `onMounted` of `SidebarTemplates.vue` (or in `Index.vue`) — not
  inside the store setup, to keep the store passive.

- [x] **6.3 Update `SidebarTemplates.vue`**
  - Call `store.fetchTemplates()` in `onMounted`
  - Show loading skeleton while `store.isLoading`
  - Show error `Alert` if `store.error` is set with a "Retry" button

- [x] **6.4 Optimistic vs. pessimistic updates** — used **pessimistic** updates for simplicity:
  wait for API response before updating the local list; on error, show `store.error` and do not
  change local state.

## Notes

File structure after sprint:
```
src/
  services/
    templateService.ts        ← new
  stores/
    templateStore.ts          ← updated (remove localStorage, add API calls)
  components/
    layout/
      SidebarTemplates.vue    ← updated (loading + error states)
```

Acceptance criteria:
- [x] Templates load from API on mount
- [x] Create / update / delete sync with backend
- [x] Loading state shown during API calls
- [x] Error state shown with retry option on failure
- [x] Removing localStorage has no regressions
- [x] No TypeScript errors (`pnpm typecheck`)
