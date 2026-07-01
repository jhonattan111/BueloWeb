# Sprint 3 (Frontend) — Render API Integration

## Goal
Call `POST /api/report/render` when the user clicks "Render", receive a PDF blob, and store it in
reactive state. No display yet.

## Status
`[x] done`

## Dependencies
- Sprint 2 (Monaco Editor) — complete
- Backend must be running at a configurable base URL

## Scope

- [x] **3.1 Create environment variable** — `.env`
  ```
  VITE_API_BASE_URL=http://localhost:5000
  ```
  Access in code via `import.meta.env.VITE_API_BASE_URL`.

- [x] **3.2 Create `reportService.ts`** — `src/services/reportService.ts`
  ```ts
  interface RenderReportParams {
    template: string
    data: object
    fileName?: string
    mode?: 'Builder'
  }

  async function renderReport(template: string, data: object): Promise<Blob>
  ```
  Implementation details: use `fetch` (no axios dependency needed), `method: 'POST'`,
  `Content-Type: application/json`, body `JSON.stringify({ template, data, mode: 'Builder' })`; on
  non-OK response throw an `Error` with the response status text; on success return
  `response.blob()`.

- [x] **3.3 Create Pinia store `useReportStore`** — `src/stores/reportStore.ts`
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

  > Install Pinia if not present: `pnpm add pinia`. Register in `main.ts`: `app.use(createPinia())`

- [x] **3.4 Update `CodeEditorPanel.vue`**
  - Import and use `useReportStore`
  - On "Render" button click: call `store.render(templateCode.value, jsonData.value)`
  - Bind `disabled` and loading spinner to `store.isRendering`
  - Show inline error if `store.renderError` is set (use shadcn `Alert` or a simple red `<p>`)

## Notes

File structure after sprint:
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

Acceptance criteria:
- [x] Clicking "Render" calls the API
- [x] Invalid JSON shows an error message, no API call made
- [x] API error surfaces as user-visible message
- [x] `isRendering` disables the button during request
- [x] `pdfBlob` is populated on success
- [x] No TypeScript errors (`pnpm typecheck`)
