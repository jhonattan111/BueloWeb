# Sprint 18 (Frontend) — Inline Project Config + Format at Creation

## Goal
Remove the `/project` route and the `project.bueloproject` node entirely. Project page settings are
now configured inline via the `@project` directive in each `.buelo` file, surfaced through a
collapsible **Settings** panel below the file tree (JSReport-style). The output format (PDF/Excel) is
chosen once when creating a new `.buelo` report — not when downloading.

## Status
`[x] done`

## Dependencies
- Sprint 18 backend complete ✅ (`@project` directive parseable; `TemplateRecord.OutputFormat` available)
- Sprint 17 frontend complete ✅ (format-aware render pipeline in `reportStore`)
- Sprint 15 frontend complete ✅ (`projectService`, `projectStore` exist and can be removed)

---

## Tasks

### FE-18.1 — Remove `/project` route and `ProjectEditor` page

File: `src/router/index.ts`

Remove the `{ path: '/project', component: ProjectEditor }` route entry.

File: `src/pages/ProjectEditor/` — delete the entire directory.

---

### FE-18.2 — Remove `project.bueloproject` node from workspace tree

File: `src/services/workspaceService.ts`

In `fetchWorkspaceTree()`, remove the `projectNode` constant and remove it from the returned array:

```ts
// DELETE: const projectNode: FileNode = { id: 'project', name: 'project.bueloproject', ... }
// DELETE: return [projectNode, ...templateNodes, ...]
// REPLACE with:
return [...templateNodes, ...(globalFolderNode ? [globalFolderNode] : [])]
```

---

### FE-18.3 — Remove `project` node type from `FileNode`

File: `src/types/workspace.ts`

```ts
// Before:
export type FileNodeType = 'template' | 'global-artefact' | 'project' | 'folder'

// After:
export type FileNodeType = 'template' | 'global-artefact' | 'folder'
```

Remove the `project` case from any switch statements in `FileTreePanel.vue`, `ReportEditor/Index.vue`,
and `useWorkspaceTree.ts`.

---

### FE-18.4 — Remove `projectService.ts` and `projectStore.ts`

Files to delete:
- `src/services/projectService.ts`
- `src/stores/projectStore.ts`

Remove all imports of these files throughout the codebase.

---

### FE-18.5 — `ProjectSettingsPanel.vue` — collapsible panel below file tree

File: `src/components/layout/ProjectSettingsPanel.vue` (new file)

This panel appears at the bottom of the left sidebar, below the file tree, always visible regardless
of which node is selected. It reads and writes the `@project` directive block in the **currently
active `.buelo` file** (i.e. the one whose template is active in the editor).

**UI structure:**

```
▾ Report Settings                        [collapse toggle]
  ─────────────────────────────────────────────────────────
  Page Size       [ A4 ▼ ]
  Orientation     [ Portrait ▼ ]
  Margin H        [ 2.0 ]  Margin V  [ 2.0 ]
  Background      [#FFFFFF ████]
  Text Color      [#000000 ████]
  Font Size       [ 12 ]
  ☑ Show Header   ☑ Show Footer
  Watermark       [________________]
  ─────────────────────────────────────────────────────────
  [ Apply to file ]
```

**Behaviour:**
- Read the active template's source code from `useActiveTemplate().files`.
- Parse the existing `@project` block (simple regex / string split — no need to call the backend).
- On "Apply to file": regenerate the `@project` block and insert/replace it at the top of the source,
  then call `useActiveTemplate().saveFile({ path: 'template.report.cs', content: updatedSource })`.
- Only enabled (not greyed out) when an active `.buelo` template is loaded.
- When no template is active, show a "Open a .buelo file to configure settings" placeholder.

**`@project` block serialisation helper** (internal to the component):

```ts
function serializeProjectBlock(settings: ProjectSettings): string {
  const lines = ['@project']
  if (settings.pageSize)           lines.push(`  pageSize: ${settings.pageSize}`)
  if (settings.orientation)        lines.push(`  orientation: ${settings.orientation}`)
  if (settings.marginHorizontal != null) lines.push(`  marginHorizontal: ${settings.marginHorizontal}`)
  if (settings.marginVertical   != null) lines.push(`  marginVertical: ${settings.marginVertical}`)
  if (settings.backgroundColor)    lines.push(`  backgroundColor: "${settings.backgroundColor}"`)
  if (settings.defaultTextColor)   lines.push(`  defaultTextColor: "${settings.defaultTextColor}"`)
  if (settings.defaultFontSize)    lines.push(`  defaultFontSize: ${settings.defaultFontSize}`)
  lines.push(`  showHeader: ${settings.showHeader}`)
  lines.push(`  showFooter: ${settings.showFooter}`)
  if (settings.watermarkText)      lines.push(`  watermarkText: "${settings.watermarkText}"`)
  return lines.join('\n')
}
```

**`@project` block parse helper** (internal):

```ts
function parseProjectBlock(source: string): Partial<ProjectSettings> {
  const match = source.match(/@project\s*\n((?:[ \t]+.+\n?)*)/)
  if (!match) return {}
  const block = match[1]
  const kv = Object.fromEntries(
    block.split('\n')
         .map(l => l.trim().match(/^(\w+):\s*(.+)$/))
         .filter(Boolean)
         .map(m => [m![1], m![2].replace(/^"|"$/g, '')])
  )
  return {
    pageSize:           kv['pageSize'],
    orientation:        kv['orientation'],
    marginHorizontal:   kv['marginHorizontal']  ? +kv['marginHorizontal']  : undefined,
    marginVertical:     kv['marginVertical']    ? +kv['marginVertical']    : undefined,
    backgroundColor:    kv['backgroundColor'],
    defaultTextColor:   kv['defaultTextColor'],
    defaultFontSize:    kv['defaultFontSize']   ? +kv['defaultFontSize']   : undefined,
    showHeader:         kv['showHeader']         ? kv['showHeader'] === 'true' : undefined,
    showFooter:         kv['showFooter']         ? kv['showFooter'] === 'true' : undefined,
    watermarkText:      kv['watermarkText'],
  }
}
```

---

### FE-18.6 — Wire `ProjectSettingsPanel` into `AppLayout`

File: `src/components/layout/AppLayout.vue`

Add `ProjectSettingsPanel` at the bottom of the left sidebar slot, inside a scrollable area:

```html
<template #sidebar-left>
  <div class="flex flex-col h-full min-h-0">
    <FileTreePanel class="flex-1 min-h-0" @open-file="..." />
    <ProjectSettingsPanel />
  </div>
</template>
```

The panel should be collapsible (collapsed by default) so it does not crowd the file tree.

---

### FE-18.7 — Add `outputFormat` to `NewFileDialog` for `.buelo` files

File: `src/components/editors/NewFileDialog.vue`

When the selected file type is `Report (.buelo)`, show a radio/select for output format:

```
Output format:  ● PDF  ○ Excel
```

Store this as a local ref `outputFormat: ref<'pdf' | 'excel'>('pdf')`.

On `confirm()`, when creating a `.buelo` file via `templateStore.createTemplate`, pass `outputFormat`
in the template record payload:

```ts
await templateStore.createTemplate({
  name: name.value.trim(),
  template: BUELO_STARTER_TEMPLATE,
  outputFormat: outputFormat.value,   // ← new field
})
```

Reset to `'pdf'` when the dialog closes.

---

### FE-18.8 — Pass `outputFormat` through `templateStore` and `templateService`

File: `src/stores/templateStore.ts`

Update `createTemplate` action to accept and forward `outputFormat`:

```ts
async function createTemplate(options: {
  name: string
  template?: string
  outputFormat?: 'pdf' | 'excel'
}): Promise<void>
```

File: `src/services/templateService.ts`

Update the `createTemplate` payload type to include `outputFormat?: 'pdf' | 'excel'`.

---

### FE-18.9 — Remove `FormatSelector` from `PreviewPanel`

File: `src/components/preview/PreviewPanel.vue`

Remove the `<FormatSelector>` component and its associated `v-if` guard. The format is no longer
chosen at render time — it comes from the template record.

File: `src/components/preview/FormatSelector.vue` — **delete**.

File: `src/stores/reportStore.ts`

Remove `selectedFormat`, `supportedFormats`, `loadFormats()`, and `setFormat()`.
Update `render()` and `renderTemplate()` to derive the format from the active template's `outputFormat`
field instead of `selectedFormat`:

```ts
const format = templateStore.activeTemplate?.outputFormat ?? 'pdf'
```

---

### FE-18.10 — Update `reportService.ts` format derivation

File: `src/services/reportService.ts`

The `format` param in `renderReport` / `renderById` is now always derived internally from the
template — callers no longer pass it. Keep the function signature but default `format` from the
`TemplateRecord` stored in the template store.

---

### FE-18.11 — Remove `FormatHintsPanel` (or demote it)

File: `src/components/preview/FormatHintsPanel.vue`

If Excel-specific hints (e.g. sheet name) are still needed, move them into `ProjectSettingsPanel`
rather than the preview panel. If unused, delete the file.

---

## Page/File Deletions Summary

| File | Action |
|------|--------|
| `src/pages/ProjectEditor/Index.vue` | delete |
| `src/pages/ProjectEditor/` | delete directory |
| `src/services/projectService.ts` | delete |
| `src/stores/projectStore.ts` | delete |
| `src/components/preview/FormatSelector.vue` | delete |

## New Files

| File | Purpose |
|------|---------|
| `src/components/layout/ProjectSettingsPanel.vue` | Collapsible settings panel below file tree |
