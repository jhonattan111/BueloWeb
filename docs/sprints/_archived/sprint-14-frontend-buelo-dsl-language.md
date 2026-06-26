# Sprint 14 (Frontend) — .buelo DSL Monaco Language (Component-Aware IntelliSense)

## Goal
Register a completely redesigned `buelo` Monaco language that reflects the new YAML-like component DSL introduced in backend Sprint 14. Replace the previous C#-flavored tokenizer with a component-aware language: syntax highlighting for all layout and content components, full IntelliSense for component properties, style values, import syntax, and template expressions. The language must be extensible as new components are added.

## Status
`[ ] pending`

## Dependencies
- Sprint 14 backend complete ✅ (`.buelo` DSL spec finalized)
- Sprint 13 frontend complete ✅ (file tree opens `.buelo` files with `language: 'buelo'`)
- Existing Monaco setup from Sprint 10 ✅

---

## Tasks

### FE-14.1 — Update `spec.ts` — Language specification

File: `src/lib/buelo-language/spec.ts` (full rewrite)

```ts
// Layout components — top-level block starters
export const LAYOUT_COMPONENTS = [
  { name: 'report title',    doc: 'Top-of-report title block. Rendered once at the beginning.' },
  { name: 'report resume',   doc: 'End-of-report summary block. Rendered once at the end.' },
  { name: 'page header',     doc: 'Rendered at the top of every page.' },
  { name: 'page footer',     doc: 'Rendered at the bottom of every page.' },
  { name: 'header',          doc: 'Flexible header region. Use header column children for multi-column layout.' },
  { name: 'footer',          doc: 'Flexible footer region. Use footer column children for multi-column layout.' },
  { name: 'header column',   doc: 'Column within a header block.' },
  { name: 'footer column',   doc: 'Column within a footer block.' },
  { name: 'group header',    doc: 'Rendered at the start of each data group (inside data block).' },
  { name: 'group footer',    doc: 'Rendered at the end of each data group (inside data block).' },
  { name: 'data',            doc: 'Data iteration container. Iterates over the bound data array.' },
] as const

// Content components — inline block content
export const CONTENT_COMPONENTS = [
  { name: 'text',      doc: 'Plain or interpolated text. Use {{ expr }} for dynamic values.' },
  { name: 'image',     doc: 'Embedded image from a path or data URI.' },
  { name: 'rich text', doc: 'Multi-run formatted text with mixed styles.' },
  { name: 'spacer',    doc: 'Vertical whitespace.' },
  { name: 'panel',     doc: 'Bordered, padded container for grouping content.' },
  { name: 'card',      doc: 'Elevated block with optional shadow and background.' },
  { name: 'table',     doc: 'Tabular data component with column definitions and optional grouping.' },
] as const

// Directives
export const DIRECTIVES = [
  { name: 'import',    syntax: 'import { FuncName } from "artefact-name"', doc: 'Import helper functions from a .csx or .cs artefact.' },
  { name: '@data',     syntax: '@data from "file-or-id"',                  doc: 'Bind a data artefact or global JSON file to this template.' },
  { name: '@settings', syntax: '@settings\n  size: A4\n  orientation: Portrait\n  margin: 2cm', doc: 'Configure page size, orientation, and margin.' },
  { name: '@format',   syntax: '@format\n  excel:\n    sheetName: Sheet1',  doc: 'Format-specific output settings (e.g. Excel sheet name).' },
] as const

// Style properties
export const STYLE_PROPERTIES = [
  { name: 'fontSize',         values: [],                                       doc: 'Font size in pt. Example: 12' },
  { name: 'bold',             values: ['true', 'false'],                        doc: 'Bold text.' },
  { name: 'italic',           values: ['true', 'false'],                        doc: 'Italic text.' },
  { name: 'color',            values: [],                                       doc: 'Text color. Hex (#RRGGBB) or named color.' },
  { name: 'backgroundColor',  values: [],                                       doc: 'Background fill color.' },
  { name: 'align',            values: ['left', 'center', 'right', 'justify'],   doc: 'Text alignment.' },
  { name: 'padding',          values: [],                                       doc: 'Inner padding. CSS-like: "4px" or "4px 8px".' },
  { name: 'margin',           values: [],                                       doc: 'Outer margin. CSS-like.' },
  { name: 'border',           values: [],                                       doc: 'Border definition. Example: "1px solid #CCCCCC".' },
  { name: 'width',            values: [],                                       doc: 'Element width. Use %, px, or * for fill.' },
  { name: 'height',           values: [],                                       doc: 'Element height. Use px, cm, or * for fill.' },
  { name: 'inherit',          values: [],                                       doc: 'Inherit a named style definition.' },
] as const

// Table column properties
export const TABLE_COLUMN_PROPERTIES = [
  { name: 'field',   doc: 'Data field name to display.' },
  { name: 'label',   doc: 'Column header label.' },
  { name: 'width',   doc: 'Column width: %, px, or * (fill).' },
  { name: 'format',  values: ['currency', 'date', 'percent'], doc: 'Built-in value formatter, or a helper function name.' },
] as const

// Page settings values
export const PAGE_SIZES = ['A4', 'A3', 'A5', 'Letter', 'Legal'] as const
export const ORIENTATIONS = ['Portrait', 'Landscape'] as const

// Built-in template expression variables
export const EXPRESSION_VARS = [
  { name: 'data',      doc: 'Bound data object. Use data.fieldName.' },
  { name: 'page',      doc: 'Current page number.' },
  { name: 'pageCount', doc: 'Total page count.' },
  { name: 'now',       doc: 'Current DateTime.' },
  { name: 'value',     doc: 'Current item value (inside group header/footer).' },
  { name: 'subtotal',  doc: 'Group subtotal (inside group footer, for numeric fields).' },
  { name: 'count',     doc: 'Total count of data items.' },
] as const
```

---

### FE-14.2 — Update `tokenizer.ts` — Monarch rules for YAML-like syntax

File: `src/lib/buelo-language/tokenizer.ts` (full rewrite)

Token rules (applied in order):

1. **Comments**: `/^\s*#.*$/m` → `comment`
2. **Import directive**: `/^import\b/` → `keyword.directive`; `/{[^}]+}/` after import → `variable.import`; `/"[^"]+"/` → `string`
3. **@-directives**: `/@(data|settings|format)\b/` → `keyword.directive`
4. **Layout component keywords** (must be at column 0): pattern built from `LAYOUT_COMPONENTS` names → `keyword.layout`
5. **Content component keywords** (indented): pattern built from `CONTENT_COMPONENTS` names + `:` → `keyword.content`
6. **Property keys** (indented `key:`): `/^\s+\w[\w-]*:/m` → `type.property`
7. **`style:` block opener**: `/^\s+style:/m` → `keyword.section`
8. **List item**: `/^\s+-\s/m` → `operator`
9. **Template expressions**: `/\{\{[^}]*\}\}/` → `variable.expression` (distinct highlighting)
10. **String values**: `/"[^"]*"/` → `string`
11. **Boolean values**: `/\b(true|false)\b/` → `keyword.bool`
12. **Numeric values**: `/\b\d+(\.\d+)?\b/` → `number`
13. **Color hex values**: `/#[0-9A-Fa-f]{3,8}\b/` → `string.color`
14. **CSS-unit values**: `/\d+(px|cm|in|mm|%|pt)\b/` → `number.unit`

---

### FE-14.3 — Update `completions.ts` — Component-aware completion

File: `src/lib/buelo-language/completions.ts` (full rewrite)

Trigger characters: ` `, `:`, `{`, `"`, `@`

Context detection (based on line content and indentation level):

| Context | Trigger condition | Completions |
|---------|-------------------|-------------|
| Top of file (no indent) | Blank line at column 0 | All `LAYOUT_COMPONENTS` + `import` + `@data` + `@settings` |
| Inside layout component (2-space indent) | After a layout component block | All `CONTENT_COMPONENTS` + `style:` |
| Inside `style:` (4-space indent) | After `style:` | All `STYLE_PROPERTIES` |
| Style property value | After `align:`, `bold:` etc. | Property-specific values from `STYLE_PROPERTIES[n].values` |
| Inside `table:` | After `table:` | `columns:`, `group header:`, `group footer:`, `zebra:`, `headerStyle:`, `style:` |
| Inside `columns:` list item | After `- ` | All `TABLE_COLUMN_COLUMNS_PROPERTIES` |
| Import `from "` | After `from "` | Artefact names fetched from `GET /api/artefacts?extension=.csx` + `GET /api/templates/{id}/artefacts` |
| `@data from "` | After `from "` on `@data` line | Artefact names from `GET /api/artefacts?extension=.json` |
| `@settings` block | After `size:` | `PAGE_SIZES`; after `orientation:` → `ORIENTATIONS` |
| Template expression `{{ ` | Inside `{{ }}` | `EXPRESSION_VARS` |

Completion item kinds:
- Layout/content components → `Keyword`
- Style properties → `Property`
- Style values → `EnumMember`
- Artefact names → `File`
- Expression vars → `Variable`

---

### FE-14.4 — Update `hover.ts` — Component and property hover docs

File: `src/lib/buelo-language/hover.ts` (full rewrite)

On hover:
1. Detect word under cursor
2. Match against `LAYOUT_COMPONENTS`, `CONTENT_COMPONENTS`, `DIRECTIVES`, `STYLE_PROPERTIES`, `TABLE_COLUMN_PROPERTIES`, `EXPRESSION_VARS`
3. Return `MarkdownString` with:
   - **Component name** as heading
   - Description from spec
   - Example snippet (for components)
   - Valid values list (for style properties with enum values)

---

### FE-14.5 — Update `snippets.ts` — Full component snippets

File: `src/lib/buelo-language/snippets.ts` (full rewrite)

Snippets for each component (triggered by component name):

```ts
{
  label: 'report title',
  insertText: `report title:\n  text: "\${1:Report Title}"\n  style:\n    fontSize: \${2:18}\n    bold: true\n    align: \${3|left,center,right|}`,
  documentation: 'Top-of-report title block'
}

{
  label: 'table',
  insertText: `table:\n  columns:\n    - field: \${1:fieldName}\n      label: \${2:Column Header}\n      width: \${3:*}\n  zebra: \${4|true,false|}`,
  documentation: 'Tabular data component'
}

{
  label: 'import',
  insertText: `import { \${1:FunctionName} } from "\${2:artefact-name}"`,
  documentation: 'Import helper functions'
}

// ... one snippet per layout and content component
```

---

### FE-14.6 — Starter template content

When creating a new `.buelo` file (from `NewFileDialog.vue`), pre-fill with:

```yaml
# New report — edit the components below
import { } from ""
@data from ""
@settings
  size: A4
  orientation: Portrait
  margin: 2cm

report title:
  text: "My Report"
  style:
    fontSize: 18
    bold: true
    align: center

page footer:
  text: "Page {{ page }} of {{ pageCount }}"
  style:
    align: center
    fontSize: 9

data:
  table:
    columns:
      - field: id
        label: ID
        width: 10%
      - field: name
        label: Name
        width: 90%
```

---

### FE-14.7 — Remove old C# section highlighting

File: `src/lib/buelo-language/tokenizer.ts`

The old tokenizer included C#-specific rules (`page.Header()`, `page.Content()`, etc.). These are removed — the new `.buelo` format is YAML-based. C# editors (`.cs`/`.csx` artefacts) continue to use Monaco's built-in `csharp` language.

---

## Final updated spec exports

```ts
// src/lib/buelo-language/spec.ts — default export summary
export {
  LAYOUT_COMPONENTS,
  CONTENT_COMPONENTS,
  DIRECTIVES,
  STYLE_PROPERTIES,
  TABLE_COLUMN_PROPERTIES,
  PAGE_SIZES,
  ORIENTATIONS,
  EXPRESSION_VARS
}
```
