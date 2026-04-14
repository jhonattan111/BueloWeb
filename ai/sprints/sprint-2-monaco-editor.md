# Sprint 2 — Monaco Editor

## Goal
Integrate Monaco Editor into `CodeEditorPanel` with two editor instances: one for C# templates and one for JSON data, plus a "Render" button (no API call yet).

## Status
`[ ] open`

## Dependencies
- Sprint 1 complete ✅
- `monaco-editor` already installed ✅ (v0.55.1)
- Vite worker config needed (see task 2.1)

## Tasks

### 2.1 Configure Monaco in Vite
File: `vite.config.ts`

Monaco requires its workers to be bundled correctly. Add the `vite-plugin-monaco-editor` plugin or configure workers manually:

```bash
pnpm add vite-plugin-monaco-editor
```

In `vite.config.ts`:
```ts
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  plugins: [
    vue(),
    monacoEditorPlugin({ languageWorkers: ['editorWorkerService', 'json', 'typescript'] })
  ]
})
```

> Alternative (no extra plugin): use `import 'monaco-editor/esm/vs/editor/editor.worker?worker'` patterns in a `monaco.ts` setup file. Prefer the plugin approach for simplicity.

### 2.2 Create Monaco composable
File: `src/composables/useMonacoEditor.ts`
- Accepts: `containerRef: Ref<HTMLElement | null>`, `language: string`, `initialValue: string`
- Creates editor on `onMounted`, disposes on `onUnmounted`
- Returns: `getValue(): string`, `setValue(val: string): void`
- Editor options: `theme: 'vs-dark'`, `fontSize: 13`, `minimap: { enabled: false }`, `automaticLayout: true`

### 2.3 Create `TemplateEditor.vue`
File: `src/components/editors/TemplateEditor.vue`
- Container `<div ref="editorContainer" class="h-full w-full" />`
- Uses `useMonacoEditor` with `language: 'csharp'`
- Default value: preloaded C# Scriban template example:
  ```
  Hello, {{ name }}!
  Today is {{ date }}.
  ```
  *(plain text is fine for now — real Scriban syntax is not supported by Monaco out of the box)*
- Emits: `update:modelValue` on content change (use `onDidChangeModelContent`)
- Prop: `modelValue: string` — synced with editor

### 2.4 Create `JsonEditor.vue`
File: `src/components/editors/JsonEditor.vue`
- Same pattern as `TemplateEditor.vue`
- Language: `'json'`
- Default value:
  ```json
  {
    "name": "World",
    "date": "2026-04-14"
  }
  ```
- Prop/emit: `modelValue: string` (raw JSON string)

### 2.5 Update `CodeEditorPanel.vue`
File: `src/components/editors/CodeEditorPanel.vue`
- Replace placeholder with:
  - Two tabs or stacked sections: "Template" (top) and "Data (JSON)" (bottom)
  - Use shadcn `Tabs` component for the split
  - Or use a fixed 60/40 split with a divider label
- Reactive state:
  ```ts
  const templateCode = ref<string>('')
  const jsonData = ref<string>('')
  ```
- "Render" `Button` (variant default, full-width at bottom)
- Emits: `render` event with `{ template: templateCode.value, data: jsonData.value }`

### 2.6 Wire render event in `pages/ReportEditor/Index.vue`
- Listen to `@render` from `CodeEditorPanel`
- Log payload to console for now: `console.log('render requested', payload)`

## File Structure After Sprint
```
src/
  composables/
    useMonacoEditor.ts        ← new
  components/
    editors/
      TemplateEditor.vue      ← new
      JsonEditor.vue          ← new
      CodeEditorPanel.vue     ← updated
  pages/
    ReportEditor/
      Index.vue               ← updated
vite.config.ts                ← updated
```

## Acceptance Criteria
- [ ] C# editor renders with syntax highlighting
- [ ] JSON editor renders with syntax highlighting
- [ ] `templateCode` and `jsonData` are separate reactive refs
- [ ] "Render" button emits payload to parent
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Editors auto-resize when panel resizes
