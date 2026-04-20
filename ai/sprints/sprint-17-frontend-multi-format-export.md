# Sprint 17 (Frontend) — Multi-format Export (Excel + Format Selector)

## Goal
Expose multiple output formats in the preview panel. Users can select **PDF** or **Excel** before rendering. PDF continues as an iframe preview. Excel shows a "download only" message with an automatic download. The format selector respects the project's `defaultOutputFormat` setting. Format-specific hints (e.g., Excel sheet name) are configurable in a collapsible settings panel.

## Status
`[ ] pending`

## Dependencies
- Sprint 17 backend complete ✅ (`?format=pdf|excel` query param on render endpoints; `GET /api/report/formats`)
- Sprint 15 frontend complete ✅ (`projectStore` with `defaultOutputFormat`)
- Sprint 14 frontend complete ✅ (`.buelo` DSL mode aware render)

---

## Compatibility Notes from Backend Changes
- `POST /api/report/render?format=pdf` → `Content-Type: application/pdf`
- `POST /api/report/render?format=excel` → `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `GET /api/report/formats` → `[{ format, contentType, fileExtension }]`
- Excel format requires `mode: BueloDsl`; Sections mode renders PDF only
- `POST /api/report/render/{id}?format=excel` for saved templates

---

## Tasks

### FE-17.1 — `reportService.ts` updates

File: `src/services/reportService.ts`

Update `renderReport` and `renderById` to accept a `format` parameter:

```ts
export async function renderReport(
  template: string,
  data: unknown,
  options?: {
    format?: 'pdf' | 'excel'
    formatHints?: Record<string, string>
  }
): Promise<{ blob: Blob; contentType: string; fileExtension: string }>

export async function renderById(
  templateId: string,
  data?: unknown,
  options?: {
    format?: 'pdf' | 'excel'
    version?: number
    formatHints?: Record<string, string>
  }
): Promise<{ blob: Blob; contentType: string; fileExtension: string }>

export async function getSupportedFormats(): Promise<OutputFormat[]>

export interface OutputFormat {
  format: string
  contentType: string
  fileExtension: string
}
```

`formatHints` is serialized as `?format=excel&hint.sheetName=Colaboradores` or passed in request body (TBD per backend implementation).

Return type now includes `contentType` and `fileExtension` so the caller can handle download correctly regardless of format.

---

### FE-17.2 — `reportStore.ts` updates

File: `src/stores/reportStore.ts`

Add state:

```ts
const selectedFormat = ref<string>('pdf')
const supportedFormats = ref<OutputFormat[]>([])
const formatHints = ref<Record<string, string>>({})
```

Add actions:

```ts
async function loadFormats(): Promise<void>       // calls getSupportedFormats()
function setFormat(format: string): void
function setFormatHint(key: string, value: string): void
```

`selectedFormat` default: `projectStore.project?.defaultOutputFormat ?? 'pdf'` (read on first render action).

---

### FE-17.3 — `FormatSelector.vue` component

File: `src/components/preview/FormatSelector.vue` (new)

Compact segmented control / button group:

```
[ PDF ]  [ Excel ]
```

- Buttons built from `reportStore.supportedFormats` (dynamic, not hardcoded)
- Selected format highlighted (active state)
- If template mode is `Sections` or `Partial`, Excel button is disabled with tooltip: "Excel requires .buelo DSL mode"
- Emits `update:format` on selection change

---

### FE-17.4 — `FormatHintsPanel.vue` component

File: `src/components/preview/FormatHintsPanel.vue` (new)

Collapsible panel below `FormatSelector`, shown only when a non-PDF format is selected.

**For Excel format**:
- Sheet name (text input, default: template name)
- Freeze header row (toggle switch)

Props: `format: string`, `modelValue: Record<string, string>`  
Emits: `update:modelValue`

Hint keys follow `excel.sheetName`, `excel.freezeHeader` convention.

---

### FE-17.5 — Update `PreviewPanel.vue`

File: `src/components/preview/PreviewPanel.vue`

Add `FormatSelector` and `FormatHintsPanel` above the existing preview area.

Update render flow:
1. User clicks "Render" → reads `reportStore.selectedFormat`
2. Call `renderReport(...)` with `format` option
3. **If format is PDF**: existing iframe blob URL flow (unchanged)
4. **If format is Excel** (or any non-PDF):
   - Do NOT try to show in iframe
   - Trigger automatic file download using `<a href="{blob}" download="report.xlsx">`
   - Show placeholder: a card with a file icon, the generated filename, and a "Download again" button
   - Show green success toast: "Excel file downloaded"
5. **On error**: existing error banner (unchanged)

---

### FE-17.6 — Download helper utility

File: `src/lib/utils.ts` (addition)

```ts
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

Used by `PreviewPanel.vue` for non-PDF formats. Reused by existing "Download PDF" button (replace inline logic).

---

### FE-17.7 — Download button improvements

File: `src/components/preview/PreviewPanel.vue`

Existing download button now uses `reportStore.selectedFormat` to name the file correctly:

```ts
const filename = computed(() =>
  `report${currentFileExtension.value}`  // ".pdf" or ".xlsx"
)
```

`currentFileExtension`: derived from the last successful render's `fileExtension` returned by the service.

---

### FE-17.8 — Load formats on app boot

File: `src/main.ts` or `src/App.vue`

```ts
const reportStore = useReportStore()
await reportStore.loadFormats()
```

Formats are fetched once from `GET /api/report/formats` at startup. If the endpoint is unavailable (dev without backend), fall back to `['pdf']` with a warning.

---

## Final file structure additions

```
src/
  components/
    preview/
      FormatSelector.vue        ← NEW
      FormatHintsPanel.vue      ← NEW
  lib/
    utils.ts                    ← +downloadBlob function
```
