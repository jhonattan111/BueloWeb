# Sprint 4 (Frontend) — PDF Preview

## Goal
Display the PDF blob from `useReportStore` inside `PreviewPanel` using an iframe, with download
support and proper object URL lifecycle management.

## Status
`[x] done`

## Dependencies
- Sprint 3 (Render API Integration) — complete
- `pdfBlob` available in `useReportStore`

## Scope

- [x] **4.1 Update `PreviewPanel.vue`** — `src/components/preview/PreviewPanel.vue`

  State (from store):
  ```ts
  const store = useReportStore()
  const objectUrl = ref<string | null>(null)
  ```

  Derived URL — use a `watch` on `store.pdfBlob`: when blob changes to a new value, revoke previous
  URL (`URL.revokeObjectURL`), create new one (`URL.createObjectURL`), assign to `objectUrl`; when
  blob is null, revoke previous URL and set `objectUrl = null`; call `URL.revokeObjectURL` in
  `onUnmounted` to prevent memory leaks.

  Template states:
  1. **Empty** (`pdfBlob === null && !isRendering && !renderError`): centered placeholder text
     "Render a template to see the preview here", muted text color
  2. **Loading** (`isRendering === true`): centered spinner or "Rendering…" text, use shadcn
     `Skeleton` or a simple animated pulse class
  3. **Error** (`renderError !== null`): display error message in a red/destructive shadcn `Alert`
  4. **Preview** (`objectUrl !== null`): `<iframe :src="objectUrl" class="w-full h-full border-0" />`
     (or `<object>`; prefer `<iframe>` for broadest browser support)

  Download button: visible only when `objectUrl !== null`; uses an `<a>` tag
  (`:href="objectUrl"` + `download="report.pdf"`); styled as shadcn `Button` (variant outline,
  size sm); positioned top-right corner of the panel (`absolute top-2 right-2`).

- [x] **4.2 Panel layout adjustments** — panel wrapper needs `relative` class to position the
  download button absolutely; ensure `overflow-hidden` on the iframe container so it doesn't break
  the overall grid.

## Notes

File structure after sprint:
```
src/
  components/
    preview/
      PreviewPanel.vue        ← updated
```

Acceptance criteria:
- [x] Empty state shown before first render
- [x] Loading state shown while `isRendering` is true
- [x] Error state shown when `renderError` is set
- [x] PDF renders inside iframe after successful call
- [x] Previous blob URL revoked when new render completes
- [x] Object URL revoked on component unmount
- [x] "Download PDF" button triggers file download
- [x] No TypeScript errors (`pnpm typecheck`)
