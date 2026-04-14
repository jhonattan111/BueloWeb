# Sprint 4 — PDF Preview

## Goal
Display the PDF blob from `useReportStore` inside `PreviewPanel` using an iframe, with download support and proper object URL lifecycle management.

## Status
`[x] done`

## Dependencies
- Sprint 3 complete ✅
- `pdfBlob` available in `useReportStore`

## Tasks

### 4.1 Update `PreviewPanel.vue`
File: `src/components/preview/PreviewPanel.vue`

#### State (from store)
```ts
const store = useReportStore()
const objectUrl = ref<string | null>(null)
```

#### Derived URL
Use a `watch` on `store.pdfBlob`:
- When blob changes to a new value: revoke previous URL (`URL.revokeObjectURL`), create new one (`URL.createObjectURL`), assign to `objectUrl`
- When blob is null: revoke previous URL, set `objectUrl = null`
- Call `URL.revokeObjectURL` in `onUnmounted` to prevent memory leaks

#### Template states

1. **Empty** (`pdfBlob === null && !isRendering && !renderError`):
   - Centered placeholder text: "Render a template to see the preview here"
   - Muted text color

2. **Loading** (`isRendering === true`):
   - Centered spinner or "Rendering…" text
   - Use shadcn `Skeleton` or a simple animated pulse class

3. **Error** (`renderError !== null`):
   - Display error message in a red/destructive shadcn `Alert`

4. **Preview** (`objectUrl !== null`):
   - `<iframe :src="objectUrl" class="w-full h-full border-0" />`
   - Or `<object :data="objectUrl" type="application/pdf" class="w-full h-full" />`
   - Prefer `<iframe>` for broadest browser support

#### Download button
- Visible only when `objectUrl !== null`
- Uses an `<a>` tag: `:href="objectUrl"` + `download="report.pdf"`
- Styled as shadcn `Button` (variant outline, size sm)
- Position: top-right corner of the panel (`absolute top-2 right-2`)

### 4.2 Panel layout adjustments
- Panel wrapper needs `relative` class to position the download button absolutely
- Ensure `overflow-hidden` on the iframe container so it doesn't break the overall grid

## File Structure After Sprint
```
src/
  components/
    preview/
      PreviewPanel.vue        ← updated
```

## Acceptance Criteria
- [ ] Empty state shown before first render
- [ ] Loading state shown while `isRendering` is true
- [ ] Error state shown when `renderError` is set
- [ ] PDF renders inside iframe after successful call
- [ ] Previous blob URL revoked when new render completes
- [ ] Object URL revoked on component unmount
- [ ] "Download PDF" button triggers file download
- [ ] No TypeScript errors (`pnpm typecheck`)
