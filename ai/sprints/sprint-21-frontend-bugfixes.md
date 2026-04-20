# Sprint 21 (Frontend) — Bug Fixes: Autocomplete + Refresh Title

## Goal
Fix two reported bugs:
1. **Autocomplete not working** — Monaco IntelliSense for `.buelo` files is silent.
2. **Refresh button corrupts the file title** — pressing refresh replaces the displayed filename
   with a GUID.

## Status
`[x] done`

## Dependencies
- Sprint 20 frontend complete ✅ (obsolete `.cs` virtual file removed; tree is .buelo-only)

---

## Bug 1 — Monaco Autocomplete Not Working

### Root cause analysis

The completion provider is registered via `buildCompletionProvider()` in
`src/lib/buelo-language/completions.ts` and connected in `src/lib/buelo-language/index.ts`.

The most common causes for a registered completion provider being silent are:

1. **Language ID mismatch** — The language registered with `monaco.languages.register({ id })` does
   not exactly match the language ID set on the Monaco model when the editor opens.
2. **Provider registered too late** — The Monaco model for the `.buelo` file is created before
   `registerBueloLanguage()` is called; completions are never attached.
3. **`triggerCharacters` causes conflict** — An overly broad trigger character list (e.g. `' '`)
   can interfere with other providers and cause Monaco to skip the provider entirely.

### Fix — FE-21.1: Verify and align language ID

File: `src/lib/buelo-language/index.ts`

Ensure the language ID constant is defined once and reused everywhere:

```ts
export const BUELO_LANGUAGE_ID = 'buelo'
```

In `registerBueloLanguage()`, use this constant:

```ts
monaco.languages.register({ id: BUELO_LANGUAGE_ID })
monaco.languages.registerCompletionItemProvider(BUELO_LANGUAGE_ID, buildCompletionProvider())
monaco.languages.registerHoverProvider(BUELO_LANGUAGE_ID, buildHoverProvider())
```

File: `src/composables/useMonacoEditor.ts` (or wherever editor models are created)

When creating a model for a `.buelo` file, set the language using the same constant:

```ts
import { BUELO_LANGUAGE_ID } from '@/lib/buelo-language'

const model = monaco.editor.createModel(
  content,
  fileExtension === '.buelo' ? BUELO_LANGUAGE_ID : getLanguageForExtension(fileExtension),
  uri,
)
```

### Fix — FE-21.2: Ensure `registerBueloLanguage()` is called before any editor instance

File: `src/main.ts` (or the entry point)

Call `registerBueloLanguage()` during app initialisation, before Vue mounts:

```ts
import { registerBueloLanguage } from '@/lib/buelo-language'

registerBueloLanguage()

const app = createApp(App)
...
app.mount('#app')
```

If it is currently called inside a component's `onMounted`, move it here.

### Fix — FE-21.3: Remove space `' '` from trigger characters

File: `src/lib/buelo-language/completions.ts`

The `triggerCharacters` array includes `' '` (space). This often causes completions to fail or
produces thousands of irrelevant suggestions. Remove it:

```ts
// Before
triggerCharacters: [' ', ':', '{', '"', '@'],

// After
triggerCharacters: [':', '{', '"', '@', '\n'],
```

### Fix — FE-21.4: Set `quickSuggestions` Monaco editor option

File: `src/composables/useMonacoEditor.ts`

Enable quick suggestions for the `buelo` language:

```ts
const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  ...existingOptions,
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true,
  },
  suggestOnTriggerCharacters: true,
  wordBasedSuggestions: 'off',  // prevent noise from non-keyword tokens
}
```

---

## Bug 2 — Refresh Button Corrupts File Title to GUID

### Root cause analysis

File: `src/composables/useWorkspaceTree.ts`

When `refresh()` is called:
1. `templateStore.fetchTemplates()` replaces `templates.value` with a fresh array.
2. `tree.value` is rebuilt from scratch with new `FileNode` objects.
3. `selectedNode.value` still holds a **stale reference** to an old `FileNode` that is no longer
   in the tree.

File: `src/components/editors/ArtefactTabs.vue`

The tab bar shows `activeFilePath`. This is populated from `useActiveTemplate`, which seeds files
from `templateStore.activeTemplate`. After refresh, `templateStore.activeTemplate` returns the
refreshed template object whose `name` field might be the raw GUID (if the template was stored
without a proper name in the backend file system, or if the name was not properly saved).

The GUID appears because:
- `workspaceService.fetchWorkspaceTree()` maps template names as:
  `name: t.name.endsWith('.buelo') ? t.name : \`${t.name}.buelo\``
- If `t.name` from the backend is the template's `Id` (GUID) — which happens when the template
  was created via the old `templateStore.createTemplate` path that does NOT strip the GUID from
  the display name — the tree shows the GUID.

### Fix — FE-21.5: Preserve `selectedNode` identity after refresh

File: `src/composables/useWorkspaceTree.ts`

After rebuilding the tree, find the node that matches the previously selected node's `id` and
re-assign `selectedNode` to the new object:

```ts
async function refresh(): Promise<void> {
  const prevSelectedId = selectedNode.value?.id
  isLoading.value = true
  try {
    await templateStore.fetchTemplates()
    tree.value = await workspaceService.fetchWorkspaceTree()
    // Restore selected node from new tree
    if (prevSelectedId) {
      selectedNode.value = findNodeById(tree.value, prevSelectedId) ?? null
    }
  } finally {
    isLoading.value = false
  }
}

function findNodeById(nodes: FileNode[], id: string): FileNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
}
```

### Fix — FE-21.6: Normalise template name at creation time

File: `src/stores/templateStore.ts`

The `createTemplate` action uses `name: 'New Template'` as a default. Make sure this is set
and that `templateService.createTemplate` persists the human-readable name, not the GUID.

Verify `FileSystemTemplateStore.SaveAsync` writes `Name` into the `template.record.json` metadata
and that `ListAsync` reads it back. If the stored `Name` field is empty or missing, `t.name`
returns an empty string, and the workspace tree builder may fall back to using the template `Id`
as the display name.

Add a guard in `workspaceService.fetchWorkspaceTree`:

```ts
const templateNodes: FileNode[] = templates.map((t) => {
  const displayName = t.name?.trim()
    ? (t.name.endsWith('.buelo') ? t.name : `${t.name}.buelo`)
    : `[unnamed-${t.id.slice(0, 8)}].buelo`  // never show a bare GUID
  return {
    id: t.id,
    name: displayName,
    extension: '.buelo',
    type: 'folder',
    children: buildTemplateChildren(t.id, t.artefacts),
  }
})
```

### Fix — FE-21.7: Update `activeFilePath` after refresh

File: `src/composables/useActiveTemplate.ts`

After `templateStore.fetchTemplates()` completes inside `useWorkspaceTree.refresh()`, the
`templateStore.activeTemplate` computed is re-evaluated with the fresh data. If the watcher on
`activeTemplateId` does not fire (because the ID itself did not change), the `files` state may
be stale.

Add a secondary watcher on a relevant property of `templateStore.activeTemplate` to re-seed
`activeFilePath`:

```ts
// Existing watcher: fires only when activeTemplateId changes
watch(() => templateStore.activeTemplateId, ...)

// NEW: fires when the active template's name changes (e.g. after refresh)
watch(
  () => templateStore.activeTemplate?.name,
  () => {
    // Re-derive the display path from the updated template name
    if (templateStore.activeTemplateId && activeFilePath.value === 'template.report.cs') {
      // Still on the default — nothing to re-seed
    }
    // If the path was set to a GUID-derived value, reset to the proper name
  },
)
```

Alternatively, the simplest fix is: after `loadFiles()` completes, set `activeFilePath` to the
correct file path derived from the template name, not from the stale node id.

---

## Acceptance Criteria

### Autocomplete
- Typing `@` at the start of a line in a `.buelo` file shows directive suggestions (`@data`,
  `@settings`, `@project`, `import`).
- Typing `report ` shows layout component completions (`report title`, `report resume`).
- Typing `  text: ` inside a component block shows style property completions.
- After a `@data` directive, `{{ ` inside a text value shows expression variable suggestions.

### Refresh button
- Clicking refresh in the file tree explorer does NOT change the filename/title shown in
  the editor tab bar.
- The tree re-renders with up-to-date file names.
- The previously selected node remains highlighted in the tree after refresh.
- No GUID appears as a filename anywhere in the UI after refresh.
