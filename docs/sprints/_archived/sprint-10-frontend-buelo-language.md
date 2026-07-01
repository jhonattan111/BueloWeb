# Sprint 10 (Frontend) — Buelo Language (Monaco DSL + Autocomplete)

## Goal
Register the `buelo` language in Monaco Editor with syntax highlighting, snippet-based autocompletion for all DSL directives, and hover documentation. Replace all `language: 'csharp'` usages in template editors with `language: 'buelo'`.

## Status
`[x] archived — DSL era, removed`

## Dependencies
- Sprint 6 complete
- Sprint 7 backend complete (validate endpoint available)
- Monaco Editor already installed via `vite-plugin-monaco-editor`

## Notes
- New `/api/report/validate` endpoint available for live diagnostics at the time of this sprint.
- This sprint's `.buelo` DSL language work was later removed when the product moved away from the
  custom DSL. Content below is kept as the historical record of what the removed system used to do.

## Scope

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
  { name: 'import',    syntax: '@import header|footer|content from "<name-or-guid>"',    doc: 'Imports a Partial template into a specific slot (header, footer, or content). Resolved by GUID first, then by name (case-insensitive).' },
  { name: 'data',      syntax: '@data from "<ref>"',              doc: 'Binds a data artefact or JSON file to this template.' },
  { name: 'settings',  syntax: '@settings { size: "A4"; margin: "2cm"; orientation: "Portrait"; }', doc: 'Configures page size, margin and orientation. Values must be quoted strings.' },
  { name: 'schema',    syntax: '@schema record Name(string Prop);', doc: 'Declares an inline typed record for data binding.' },
  { name: 'helper',    syntax: '@helper Name(params) => expr;',   doc: 'Declares an inline helper function. Alternatively, @helper from "artefact-name" loads helpers from a .helpers.cs artefact (takes precedence over inline declarations).' },
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

---

## Acceptance Criteria
- [x] `buelo` language registered; `@import`, `@data`, `@settings`, `@schema`, `@helper` highlighted as directives
- [x] Typing `@` in a Sections editor opens autocomplete with all directives
- [x] `@import ... from "` autocomplete shows only `Partial` templates from the backend
- [x] Hovering `data` shows type `dynamic` + description
- [x] JSON data editors are unaffected (still use `language: 'json'`)
