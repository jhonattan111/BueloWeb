# Sprint 3 — Render API Integration

## Goal
Call `POST /api/report/render` when the user clicks "Render", receive a PDF blob, and store it in reactive state. No display yet.

## Status
`[x] done`

## Dependencies
- Sprint 2 complete ✅
- Backend must be running at a configurable base URL

## Tasks

### 3.1 Create environment variable
File: `.env`
```
VITE_API_BASE_URL=http://localhost:5000
```

Access in code via `import.meta.env.VITE_API_BASE_URL`.

### 3.2 Create `reportService.ts`
File: `src/services/reportService.ts`

```ts
interface RenderReportParams {
  template: string
  data: object
  fileName?: string
  mode?: 'Builder'
}

async function renderReport(template: string, data: object): Promise<Blob>
```

Implementation details:
- Use `fetch` (no axios dependency needed)
- `method: 'POST'`
- `Content-Type: application/json`
- Body: `JSON.stringify({ template, data, mode: 'Builder' })`
- On non-OK response: throw an `Error` with the response status text
- On success: return `response.blob()`

### 3.3 Create Pinia store `useReportStore`
File: `src/stores/reportStore.ts`

State:
```ts
pdfBlob: Blob | null
isRendering: boolean
renderError: string | null
```

Action `render(template: string, rawJson: string)`:
1. Validate `rawJson` with `JSON.parse` — catch and set `renderError`
2. Set `isRendering = true`, clear `renderError`
3. Call `reportService.renderReport(template, parsedData)`
4. On success: store blob in `pdfBlob`
5. On failure: set `renderError` to error message
6. Finally: `isRendering = false`

> Install Pinia if not present: `pnpm add pinia`
> Register in `main.ts`: `app.use(createPinia())`

### 3.4 Update `CodeEditorPanel.vue`
- Import and use `useReportStore`
- On "Render" button click: call `store.render(templateCode.value, jsonData.value)`
- Bind `disabled` and loading spinner to `store.isRendering`
- Show inline error if `store.renderError` is set (use shadcn `Alert` or a simple red `<p>`)

## File Structure After Sprint
```
src/
  services/
    reportService.ts          ← new
  stores/
    reportStore.ts            ← new
  components/
    editors/
      CodeEditorPanel.vue     ← updated
  main.ts                     ← updated (pinia)
.env                          ← new
```

## Acceptance Criteria
- [ ] Clicking "Render" calls the API
- [ ] Invalid JSON shows an error message, no API call made
- [ ] API error surfaces as user-visible message
- [ ] `isRendering` disables the button during request
- [ ] `pdfBlob` is populated on success
- [ ] No TypeScript errors (`pnpm typecheck`)
