// ── Layout components — top-level block starters ─────────────────────────────
export const LAYOUT_COMPONENTS = [
  { name: 'report title',  doc: 'Top-of-report title block. Rendered once at the beginning.' },
  { name: 'report resume', doc: 'End-of-report summary block. Rendered once at the end.' },
  { name: 'page header',   doc: 'Rendered at the top of every page.' },
  { name: 'page footer',   doc: 'Rendered at the bottom of every page.' },
  { name: 'header',        doc: 'Flexible header region. Use header column children for multi-column layout.' },
  { name: 'footer',        doc: 'Flexible footer region. Use footer column children for multi-column layout.' },
  { name: 'header column', doc: 'Column within a header block.' },
  { name: 'footer column', doc: 'Column within a footer block.' },
  { name: 'group header',  doc: 'Rendered at the start of each data group (inside data block).' },
  { name: 'group footer',  doc: 'Rendered at the end of each data group (inside data block).' },
  { name: 'data',          doc: 'Data iteration container. Iterates over the bound data array.' },
] as const

// ── Content components — inline block content ─────────────────────────────────
export const CONTENT_COMPONENTS = [
  { name: 'text',      doc: 'Plain or interpolated text. Use {{ expr }} for dynamic values.' },
  { name: 'image',     doc: 'Embedded image from a path or data URI.' },
  { name: 'rich text', doc: 'Multi-run formatted text with mixed styles.' },
  { name: 'spacer',    doc: 'Vertical whitespace.' },
  { name: 'panel',     doc: 'Bordered, padded container for grouping content.' },
  { name: 'card',      doc: 'Elevated block with optional shadow and background.' },
  { name: 'table',     doc: 'Tabular data component with column definitions and optional grouping.' },
] as const

// ── Directives ────────────────────────────────────────────────────────────────
export const DIRECTIVES = [
  { name: 'import',    syntax: 'import { FuncName } from "artefact-name"',                       doc: 'Import helper functions from a .csx or .cs artefact.' },
  { name: '@data',     syntax: '@data from "file-or-id"',                                        doc: 'Bind a data artefact or global JSON file to this template.' },
  { name: '@settings', syntax: '@settings\n  size: A4\n  orientation: Portrait\n  margin: 2cm', doc: 'Configure page size, orientation, and margin.' },
  { name: '@format',   syntax: '@format\n  excel:\n    sheetName: Sheet1',                       doc: 'Format-specific output settings (e.g. Excel sheet name).' },
] as const

// ── Style properties ──────────────────────────────────────────────────────────
export const STYLE_PROPERTIES = [
  { name: 'fontSize',        values: [] as string[],                              doc: 'Font size in pt. Example: 12' },
  { name: 'bold',            values: ['true', 'false'],                           doc: 'Bold text.' },
  { name: 'italic',          values: ['true', 'false'],                           doc: 'Italic text.' },
  { name: 'color',           values: [] as string[],                              doc: 'Text color. Hex (#RRGGBB) or named color.' },
  { name: 'backgroundColor', values: [] as string[],                              doc: 'Background fill color.' },
  { name: 'align',           values: ['left', 'center', 'right', 'justify'],      doc: 'Text alignment.' },
  { name: 'padding',         values: [] as string[],                              doc: 'Inner padding. CSS-like: "4px" or "4px 8px".' },
  { name: 'margin',          values: [] as string[],                              doc: 'Outer margin. CSS-like.' },
  { name: 'border',          values: [] as string[],                              doc: 'Border definition. Example: "1px solid #CCCCCC".' },
  { name: 'width',           values: [] as string[],                              doc: 'Element width. Use %, px, or * for fill.' },
  { name: 'height',          values: [] as string[],                              doc: 'Element height. Use px, cm, or * for fill.' },
  { name: 'inherit',         values: [] as string[],                              doc: 'Inherit a named style definition.' },
] as const

// ── Table column properties ───────────────────────────────────────────────────
export const TABLE_COLUMN_PROPERTIES = [
  { name: 'field',  values: [] as string[],                              doc: 'Data field name to display.' },
  { name: 'label',  values: [] as string[],                              doc: 'Column header label.' },
  { name: 'width',  values: [] as string[],                              doc: 'Column width: %, px, or * (fill).' },
  { name: 'format', values: ['currency', 'date', 'percent'] as string[], doc: 'Built-in value formatter, or a helper function name.' },
] as const

// ── Page settings values ──────────────────────────────────────────────────────
export const PAGE_SIZES = ['A4', 'A3', 'A5', 'Letter', 'Legal'] as const
export const ORIENTATIONS = ['Portrait', 'Landscape'] as const

// ── Built-in template expression variables ────────────────────────────────────
export const EXPRESSION_VARS = [
  { name: 'data',      doc: 'Bound data object. Use data.fieldName.' },
  { name: 'page',      doc: 'Current page number.' },
  { name: 'pageCount', doc: 'Total page count.' },
  { name: 'now',       doc: 'Current DateTime.' },
  { name: 'value',     doc: 'Current item value (inside group header/footer).' },
  { name: 'subtotal',  doc: 'Group subtotal (inside group footer, for numeric fields).' },
  { name: 'count',     doc: 'Total count of data items.' },
] as const

// ── Legacy aliases (kept so old imports still compile) ────────────────────────
export const CONTEXT_VARS = EXPRESSION_VARS.map((v) => ({ ...v, type: 'dynamic' }))
export const SETTINGS_KEYS = [
  { name: 'size',        doc: 'Page size (e.g. A4, Letter).' },
  { name: 'margin',      doc: 'Page margin (e.g. 2cm, 1in).' },
  { name: 'orientation', doc: 'Page orientation: Portrait or Landscape.' },
] as const
