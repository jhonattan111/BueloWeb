import * as monaco from 'monaco-editor'

export interface SnippetDef {
  label: string
  insertText: string
  documentation: string
}

// ── Component snippets (layout + content + directives) ────────────────────────
export const COMPONENT_SNIPPETS: SnippetDef[] = [
  // ── Layout ─────────────────────────────────────────────────────────────────
  {
    label: 'report title',
    insertText: [
      'report title:',
      '  text: "${1:Report Title}"',
      '  style:',
      '    fontSize: ${2:18}',
      '    bold: true',
      '    align: ${3|left,center,right|}',
    ].join('\n'),
    documentation: 'Top-of-report title block. Rendered once at the beginning.',
  },
  {
    label: 'report resume',
    insertText: [
      'report resume:',
      '  text: "${1:Summary}"',
      '  style:',
      '    fontSize: ${2:10}',
      '    align: ${3|left,center,right|}',
    ].join('\n'),
    documentation: 'End-of-report summary block. Rendered once at the end.',
  },
  {
    label: 'page header',
    insertText: [
      'page header:',
      '  text: "${1:Header text}"',
      '  style:',
      '    fontSize: ${2:9}',
      '    align: ${3|left,center,right|}',
    ].join('\n'),
    documentation: 'Rendered at the top of every page.',
  },
  {
    label: 'page footer',
    insertText: [
      'page footer:',
      '  text: "Page {{ page }} of {{ pageCount }}"',
      '  style:',
      '    fontSize: ${1:9}',
      '    align: ${2|left,center,right|}',
    ].join('\n'),
    documentation: 'Rendered at the bottom of every page.',
  },
  {
    label: 'header',
    insertText: [
      'header:',
      '  header column:',
      '    text: "${1:Left}"',
      '  header column:',
      '    text: "${2:Right}"',
      '    style:',
      '      align: right',
    ].join('\n'),
    documentation: 'Flexible header region with multi-column support.',
  },
  {
    label: 'footer',
    insertText: [
      'footer:',
      '  footer column:',
      '    text: "${1:Left}"',
      '  footer column:',
      '    text: "${2:Right}"',
      '    style:',
      '      align: right',
    ].join('\n'),
    documentation: 'Flexible footer region with multi-column support.',
  },
  {
    label: 'header column',
    insertText: ['header column:', '  text: "${1:Content}"'].join('\n'),
    documentation: 'Column within a header block.',
  },
  {
    label: 'footer column',
    insertText: ['footer column:', '  text: "${1:Content}"'].join('\n'),
    documentation: 'Column within a footer block.',
  },
  {
    label: 'group header',
    insertText: ['group header:', '  text: "${1:Group: {{ value }}}"'].join('\n'),
    documentation: 'Rendered at the start of each data group.',
  },
  {
    label: 'group footer',
    insertText: [
      'group footer:',
      '  text: "${1:Subtotal: {{ subtotal }}}"',
      '  style:',
      '    bold: true',
    ].join('\n'),
    documentation: 'Rendered at the end of each data group.',
  },
  {
    label: 'data',
    insertText: [
      'data:',
      '  table:',
      '    columns:',
      '      - field: ${1:id}',
      '        label: ${2:ID}',
      '        width: ${3:*}',
    ].join('\n'),
    documentation: 'Data iteration container. Iterates over the bound data array.',
  },

  // ── Content ────────────────────────────────────────────────────────────────
  {
    label: 'text',
    insertText: 'text: "${1:Hello, {{ data.name }}!}"',
    documentation: 'Plain or interpolated text.',
  },
  {
    label: 'image',
    insertText: ['image:', '  src: "${1:path/to/image.png}"', '  width: ${2:100%}'].join('\n'),
    documentation: 'Embedded image from a path or data URI.',
  },
  {
    label: 'rich text',
    insertText: [
      'rich text:',
      '  - text: "${1:Bold part}"',
      '    style:',
      '      bold: true',
      '  - text: "${2: normal part}"',
    ].join('\n'),
    documentation: 'Multi-run formatted text with mixed styles.',
  },
  {
    label: 'spacer',
    insertText: ['spacer:', '  height: ${1:12}'].join('\n'),
    documentation: 'Vertical whitespace.',
  },
  {
    label: 'panel',
    insertText: [
      'panel:',
      '  style:',
      '    border: "1px solid #CCCCCC"',
      '    padding: 8px',
      '  text: "${1:Content}"',
    ].join('\n'),
    documentation: 'Bordered, padded container for grouping content.',
  },
  {
    label: 'card',
    insertText: [
      'card:',
      '  style:',
      '    backgroundColor: "#F9F9F9"',
      '    padding: 12px',
      '  text: "${1:Content}"',
    ].join('\n'),
    documentation: 'Elevated block with optional shadow and background.',
  },
  {
    label: 'table',
    insertText: [
      'table:',
      '  columns:',
      '    - field: ${1:fieldName}',
      '      label: ${2:Column Header}',
      '      width: ${3:*}',
      '  zebra: ${4|true,false|}',
    ].join('\n'),
    documentation: 'Tabular data component with column definitions.',
  },

  // ── Directives ─────────────────────────────────────────────────────────────
  {
    label: 'import',
    insertText: 'import { ${1:FunctionName} } from "${2:artefact-name}"',
    documentation: 'Import helper functions from a .csx or .cs artefact.',
  },
  {
    label: '@data',
    insertText: '@data from "${1:artefact-name}"',
    documentation: 'Bind a data artefact or global JSON file to this template.',
  },
  {
    label: '@settings',
    insertText: [
      '@settings',
      '  size: ${1|A4,A3,A5,Letter,Legal|}',
      '  orientation: ${2|Portrait,Landscape|}',
      '  margin: ${3:2cm}',
    ].join('\n'),
    documentation: 'Configure page size, orientation, and margin.',
  },
  {
    label: '@format',
    insertText: ['@format', '  excel:', '    sheetName: ${1:Sheet1}'].join('\n'),
    documentation: 'Format-specific output settings.',
  },
]

// ── Legacy exports (used by old completions/snippets references) ───────────────
export const DIRECTIVE_SNIPPETS: SnippetDef[] = COMPONENT_SNIPPETS.filter((s) =>
  s.label.startsWith('@') || s.label === 'import',
)

export const SECTION_SNIPPETS: SnippetDef[] = COMPONENT_SNIPPETS.filter((s) =>
  ['page header', 'page footer', 'header', 'footer'].includes(s.label),
)

export function toCompletionItem(
  snip: SnippetDef,
  range: monaco.IRange,
  kind: monaco.languages.CompletionItemKind,
): monaco.languages.CompletionItem {
  return {
    label: snip.label,
    kind,
    documentation: snip.documentation,
    insertText: snip.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range,
  }
}

// ── Starter template for new .buelo files (FE-14.6) ──────────────────────────
export const BUELO_STARTER_TEMPLATE = `# New report — edit the components below
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
`

