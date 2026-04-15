# Sprint 6 — Template Backend API

## Goal
Replace `localStorage` persistence with backend API calls. The store interface stays the same; only the persistence layer changes.

## Status
`[x] done`

## Dependencies
- Sprint 5 complete ✅
- Backend endpoints available:
  - `GET    /api/templates`
  - `POST   /api/templates`
  - `PUT    /api/templates/{id}`
  - `DELETE /api/templates/{id}`

## Tasks

### 6.1 Create `templateService.ts`
File: `src/services/templateService.ts`

All functions use `fetch` with base URL from `import.meta.env.VITE_API_BASE_URL`.

```ts
listTemplates(): Promise<Template[]>
getTemplate(id: string): Promise<Template>
createTemplate(payload: Omit<Template, 'id'>): Promise<Template>
updateTemplate(id: string, payload: Partial<Omit<Template, 'id'>>): Promise<Template>
deleteTemplate(id: string): Promise<void>
```

Error handling:
- On non-2xx response: throw `new Error(await response.text())` so callers get a meaningful message
- No retry logic

### 6.2 Update `useTemplateStore`
File: `src/stores/templateStore.ts`

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

Call `fetchTemplates()` in `onMounted` of `SidebarTemplates.vue` (or in `Index.vue`) — not inside the store setup, to keep the store passive.

### 6.3 Update `SidebarTemplates.vue`
- Call `store.fetchTemplates()` in `onMounted`
- Show loading skeleton while `store.isLoading`
- Show error `Alert` if `store.error` is set with a "Retry" button

### 6.4 Optimistic vs. pessimistic updates
Use **pessimistic** updates for simplicity:
- Wait for API response before updating the local list
- On error, show `store.error` and do not change local state

## File Structure After Sprint
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

## Acceptance Criteria
- [ ] Templates load from API on mount
- [ ] Create / update / delete sync with backend
- [ ] Loading state shown during API calls
- [ ] Error state shown with retry option on failure
- [ ] Removing localStorage has no regressions
- [ ] No TypeScript errors (`pnpm typecheck`)
