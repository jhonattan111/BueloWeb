# Sprint 10 — Frontend: Buelo Language (Monaco DSL + Autocomplete)

## Goal
Register the `buelo` language in Monaco Editor with syntax highlighting, snippet-based autocompletion for all DSL directives, and hover documentation. Replace all `language: 'csharp'` usages in template editors with `language: 'buelo'`.

## Status
`[ ] pending`

## Dependencies
- Sprint 6 complete ✅
- Sprint 7 backend complete (validate endpoint available) ✅
- Monaco Editor already installed via `vite-plugin-monaco-editor`

---

## Compatibility Notes from Backend Changes
- `TemplateMode` now treats `FullClass` and `Builder` as `[Obsolete]` — the type dropdown in the UI should reflect this (mark as deprecated, but keep for read compatibility of old templates)
- New `/api/report/validate` endpoint available for live diagnostics

---

## Tasks

### 10.1 — Create `src/lib/buelo-language/` module

Directory structure:

```
src/lib/buelo-language/
  index.ts          ← registers everything, called once at app boot
  tokenizer.ts      ← Monarch token rules
  completions.ts    ← CompletionItemProvider
  hover.ts          ← HoverProvider
  snippets.ts       ← full-block snippet definitions
  spec.ts           ← single source of truth: directives, sections, context vars
```

### 10.2 — `spec.ts` — Language specification constants

```ts
export const DIRECTIVES = [
  { name: 'import',    syntax: '@import <alias> from "<ref>"',    doc: 'Imports a Partial template by name or GUID.' },
  { name: 'data',      syntax: '@data from "<ref>"',              doc: 'Binds a data artefact or JSON file to this template.' },
  { name: 'settings',  syntax: '@settings { size: A4; margin: 2cm; orientation: Portrait; }', doc: 'Configures page size, margin and orientation.' },
  { name: 'schema',    syntax: '@schema record Name(string Prop);', doc: 'Declares an inline typed record for data binding.' },
  { name: 'helper',    syntax: '@helper Name(params) => expr;',   doc: 'Declares an inline helper function available in the template body.' },
] as const

export const SECTIONS = [
  { name: 'page =>',          doc: 'Optional page configuration block (size, margin).' },
  { name: 'page.Header()',    doc: 'Optional header section.' },
  { name: 'page.Content()',   doc: 'Required main content section.' },
  { name: 'page.Footer()',    doc: 'Optional footer section.' },
] as const

export const CONTEXT_VARS = [
  { name: 'data',    type: 'dynamic',          doc: 'JSON payload deserialized as ExpandoObject.' },
  { name: 'ctx',     type: 'ReportContext',     doc: 'Full render context (data, helpers, globals).' },
  { name: 'helpers', type: 'IHelperRegistry',  doc: 'Formatting helpers (FormatCurrency, FormatDate).' },
] as const

export const PAGE_SIZES = ['A4', 'A3', 'A5', 'Letter', 'Legal'] as const
export const ORIENTATIONS = ['Portrait', 'Landscape'] as const
```

### 10.3 — `tokenizer.ts` — Monarch syntax highlighting

Token rules (applied in order):
1. `/@(import|data|settings|schema|helper)\b/` → `keyword.directive`
2. `/(page)\.(Header|Content|Footer|Size|Margin)/` → `keyword.section`
3. `/"[^"]*"/` → `string` (artefact refs)
4. Fall through to C# base rules (copy relevant subsets from Monaco built-in `csharp` tokenizer or reference it):
   - Keywords: `var`, `string`, `int`, `return`, `using`, etc.
   - Comments: `//`, `/* */`
   - Strings: `"..."`, `@"..."`, `$"..."`

### 10.4 — `completions.ts` — CompletionItemProvider

Trigger characters: `@`, `.`

Cases:
- Line starts with `@` → suggest all `DIRECTIVES` as `Snippet` items with tab-stop placeholders
- After `page` → suggest `Header()`, `Content()`, `Footer()`, `Size()`, `Margin()`
- Inside `@settings { ... }` → suggest `size:`, `margin:`, `orientation:` keys; after `size:` suggest `PAGE_SIZES`
- Inside `@import ... from "` → fetch partials list from `templateService.listTemplates()` filtered by `mode === 'Partial'`; cache result for 30s
- Context variables: `data`, `ctx`, `helpers` as `Variable` items with type annotations

### 10.5 — `hover.ts` — HoverProvider

On hover over any recognized token:
- `@directive` → show `DIRECTIVES[name].doc` + full syntax example in a markdown code block
- `data`, `ctx`, `helpers` → show type + description from `CONTEXT_VARS`
- `page.Header()` etc. → show section doc from `SECTIONS`

### 10.6 — `index.ts` — Registration

```ts
import * as monaco from 'monaco-editor'

export function registerBueloLanguage(): void {
  monaco.languages.register({ id: 'buelo', extensions: ['.report.cs'], aliases: ['Buelo', 'buelo'] })
  monaco.languages.setMonarchTokensProvider('buelo', buildTokenizer())
  monaco.languages.registerCompletionItemProvider('buelo', buildCompletionProvider())
  monaco.languages.registerHoverProvider('buelo', buildHoverProvider())
}
```

Call `registerBueloLanguage()` in `src/main.ts` before `createApp`.

### 10.7 — Replace `language: 'csharp'` with `language: 'buelo'`

Files to update:
- `src/composables/useMonacoEditor.ts` — accept `language` param, default to `'buelo'` for template editors
- Any page/component that creates a Monaco instance for template source (not for JSON data editors — those stay `language: 'json'`)

### 10.8 — Deprecation badge in `TemplateMode` selector

In the template mode dropdown UI:
- Mark `FullClass` and `Builder` options with a `(deprecated)` suffix
- Still allow selecting them (do not remove) — backend still supports them
- Show a `Warning` alert when a template with deprecated mode is loaded

---

## Acceptance Criteria
- [ ] `buelo` language registered; `@import`, `@data`, `@settings`, `@schema`, `@helper` highlighted as directives
- [ ] Typing `@` in a Sections editor opens autocomplete with all directives
- [ ] `@import ... from "` autocomplete shows only `Partial` templates from the backend
- [ ] Hovering `data` shows type `dynamic` + description
- [ ] `FullClass`/`Builder` mode selector shows deprecation label + warning alert
- [ ] JSON data editors are unaffected (still use `language: 'json'`)
