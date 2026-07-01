# Sprint 2 (Frontend) — Monaco Editor

## Goal
Integrate Monaco Editor into `CodeEditorPanel` with two editor instances: one for C# templates and
one for JSON data, plus a "Render" button (no API call yet).

## Status
`[x] done`

## Dependencies
- Sprint 1 (3-column shell, Vue Router, placeholder panels) — complete
- `monaco-editor` already installed (v0.55.1)
- Vite worker config needed (see task 2.1)

## Scope

**2.1 Configure Monaco in Vite** — `vite.config.ts`
- [x] Monaco requires its workers to be bundled correctly. Add the `vite-plugin-monaco-editor`
  plugin or configure workers manually:
  ```bash
  pnpm add vite-plugin-monaco-editor
  ```
  ```ts
  import monacoEditorPlugin from 'vite-plugin-monaco-editor'

  export default defineConfig({
    plugins: [
      vue(),
      monacoEditorPlugin({ languageWorkers: ['editorWorkerService', 'json', 'typescript'] })
    ]
  })
  ```
  > Alternative (no extra plugin): use `import 'monaco-editor/esm/vs/editor/editor.worker?worker'`
  > patterns in a `monaco.ts` setup file. Prefer the plugin approach for simplicity.

**2.2 Create Monaco composable** — `src/composables/useMonacoEditor.ts`
- [x] Accepts: `containerRef: Ref<HTMLElement | null>`, `language: string`, `initialValue: string`
- [x] Creates editor on `onMounted`, disposes on `onUnmounted`
- [x] Returns: `getValue(): string`, `setValue(val: string): void`
- [x] Editor options: `theme: 'vs-dark'`, `fontSize: 13`, `minimap: { enabled: false }`,
  `automaticLayout: true`

**2.3 Create `TemplateEditor.vue`** — `src/components/editors/TemplateEditor.vue`
- [x] Container `<div ref="editorContainer" class="h-full w-full" />`
- [x] Uses `useMonacoEditor` with `language: 'csharp'`
- [x] Default value: preloaded C# Scriban template example:
  ```
  Hello, {{ name }}!
  Today is {{ date }}.
  ```
  *(plain text is fine for now — real Scriban syntax is not supported by Monaco out of the box)*
- [x] Emits: `update:modelValue` on content change (use `onDidChangeModelContent`)
- [x] Prop: `modelValue: string` — synced with editor

**2.4 Create `JsonEditor.vue`** — `src/components/editors/JsonEditor.vue`
- [x] Same pattern as `TemplateEditor.vue`
- [x] Language: `'json'`
- [x] Default value:
  ```json
  {
    "name": "World",
    "date": "2026-04-14"
  }
  ```
- [x] Prop/emit: `modelValue: string` (raw JSON string)

**2.5 Update `CodeEditorPanel.vue`** — `src/components/editors/CodeEditorPanel.vue`
- [x] Replace placeholder with:
  - Two tabs or stacked sections: "Template" (top) and "Data (JSON)" (bottom)
  - Use shadcn `Tabs` component for the split
  - Or use a fixed 60/40 split with a divider label
- [x] Reactive state:
  ```ts
  const templateCode = ref<string>('')
  const jsonData = ref<string>('')
  ```
- [x] "Render" `Button` (variant default, full-width at bottom)
- [x] Emits: `render` event with `{ template: templateCode.value, data: jsonData.value }`

**2.6 Wire render event in `pages/ReportEditor/Index.vue`**
- [x] Listen to `@render` from `CodeEditorPanel`
- [x] Log payload to console for now: `console.log('render requested', payload)`

## Notes

File structure after sprint:
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

Acceptance criteria:
- [x] C# editor renders with syntax highlighting
- [x] JSON editor renders with syntax highlighting
- [x] `templateCode` and `jsonData` are separate reactive refs
- [x] "Render" button emits payload to parent
- [x] No TypeScript errors (`pnpm typecheck`)
- [x] Editors auto-resize when panel resizes
