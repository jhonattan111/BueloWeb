# Sprint 21 (Frontend) — Bug Fixes: Autocomplete + Refresh Title

## Goal
Fix two reported bugs:
1. **Autocomplete not working** — Monaco IntelliSense for `.buelo` files is silent.
2. **Refresh button corrupts the file title** — pressing refresh replaces the displayed filename
   with a GUID.

## Status
`[x] done`

## Dependencies
- Sprint 20 frontend complete — obsolete `.cs` virtual file removed; tree is `.buelo`-only

## Scope

**Bug 1 — Monaco Autocomplete Not Working:**
- [x] FE-21.1 — Verify and align language ID (`src/lib/buelo-language/index.ts`): ensure the
  language ID constant is defined once (`BUELO_LANGUAGE_ID = 'buelo'`) and reused everywhere,
  including where editor models are created (`src/composables/useMonacoEditor.ts`)
- [x] FE-21.2 — Ensure `registerBueloLanguage()` is called before any editor instance (moved to
  `src/main.ts`, before `app.mount('#app')`, if it was previously called inside a component's
  `onMounted`)
- [x] FE-21.3 — Remove space `' '` from `triggerCharacters` in
  `src/lib/buelo-language/completions.ts` (was causing failed/noisy completions)
- [x] FE-21.4 — Set `quickSuggestions` Monaco editor option in `src/composables/useMonacoEditor.ts`
  (`quickSuggestions`, `suggestOnTriggerCharacters: true`, `wordBasedSuggestions: 'off'`)

**Bug 2 — Refresh Button Corrupts File Title to GUID:**
- [x] FE-21.5 — Preserve `selectedNode` identity after refresh (`src/composables/useWorkspaceTree.ts`):
  after rebuilding the tree, find the node that matches the previously selected node's `id` and
  re-assign `selectedNode` to the new object
- [x] FE-21.6 — Normalise template name at creation time (`src/stores/templateStore.ts` /
  `workspaceService.fetchWorkspaceTree`): never fall back to displaying a bare GUID as the
  filename; guard with a `[unnamed-xxxxxxxx].buelo` fallback when `t.name` is empty
- [x] FE-21.7 — Update `activeFilePath` after refresh (`src/composables/useActiveTemplate.ts`): the
  simplest fix was to re-derive `activeFilePath` from the correct file path after `loadFiles()`
  completes, rather than from a stale node id

## Notes

**Bug 1 root cause.** The completion provider is registered via `buildCompletionProvider()` in
`src/lib/buelo-language/completions.ts` and connected in `src/lib/buelo-language/index.ts`. The most
common causes for a registered completion provider being silent: (1) language ID mismatch between
`monaco.languages.register({ id })` and the language ID set on the Monaco model when the editor
opens; (2) the provider registered too late, after the `.buelo` file's model was already created;
(3) an overly broad `triggerCharacters` list (e.g. `' '`) interfering with other providers.

**Bug 2 root cause.** When `refresh()` is called: `templateStore.fetchTemplates()` replaces
`templates.value` with a fresh array, `tree.value` is rebuilt from scratch with new `FileNode`
objects, and `selectedNode.value` was left holding a stale reference to an old `FileNode` no longer
in the tree. Separately, the tab bar's `activeFilePath` (from `useActiveTemplate`) could resolve to
a raw GUID if the backend template `name` was empty (e.g. templates created via an old
`templateStore.createTemplate` path that didn't strip the GUID from the display name), because
`workspaceService.fetchWorkspaceTree()` mapped template names directly from `t.name`.

Acceptance criteria:
- Autocomplete: typing `@` at the start of a line in a `.buelo` file shows directive suggestions
  (`@data`, `@settings`, `@project`, `import`); typing `report ` shows layout component completions;
  typing `  text: ` inside a component block shows style property completions; after a `@data`
  directive, `{{ ` inside a text value shows expression variable suggestions.
- Refresh button: clicking refresh in the file tree explorer does not change the filename/title
  shown in the editor tab bar; the tree re-renders with up-to-date file names; the previously
  selected node remains highlighted after refresh; no GUID appears as a filename anywhere in the UI.
