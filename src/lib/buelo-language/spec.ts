export const DIRECTIVES = [
  {
    name: 'import',
    syntax: '@import header|footer|content from "<name-or-guid>"',
    doc: 'Imports a Partial template into a specific slot (header, footer, or content). Resolved by GUID first, then by name (case-insensitive).',
  },
  {
    name: 'data',
    syntax: '@data from "<ref>"',
    doc: 'Binds a data artefact or JSON file to this template.',
  },
  {
    name: 'settings',
    syntax: '@settings { size: "A4"; margin: "2cm"; orientation: "Portrait"; }',
    doc: 'Configures page size, margin and orientation. Values must be quoted strings.',
  },
  {
    name: 'schema',
    syntax: '@schema record Name(string Prop);',
    doc: 'Declares an inline typed record for data binding.',
  },
  {
    name: 'helper',
    syntax: '@helper Name(params) => expr;',
    doc: 'Declares an inline helper function. Alternatively, @helper from "artefact-name" loads helpers from a .helpers.cs artefact (takes precedence over inline declarations).',
  },
] as const

export const SECTIONS = [
  { name: 'page =>', doc: 'Optional page configuration block (size, margin).' },
  { name: 'page.Header()', doc: 'Optional header section.' },
  { name: 'page.Content()', doc: 'Required main content section.' },
  { name: 'page.Footer()', doc: 'Optional footer section.' },
] as const

export const CONTEXT_VARS = [
  { name: 'data', type: 'dynamic', doc: 'JSON payload deserialized as ExpandoObject.' },
  { name: 'ctx', type: 'ReportContext', doc: 'Full render context (data, helpers, globals).' },
  { name: 'helpers', type: 'IHelperRegistry', doc: 'Formatting helpers (FormatCurrency, FormatDate).' },
] as const

export const PAGE_SIZES = ['A4', 'A3', 'A5', 'Letter', 'Legal'] as const
export const ORIENTATIONS = ['Portrait', 'Landscape'] as const

export const SETTINGS_KEYS = [
  { name: 'size', doc: 'Page size (e.g. "A4", "Letter").' },
  { name: 'margin', doc: 'Page margin (e.g. "2cm", "1in").' },
  { name: 'orientation', doc: 'Page orientation: "Portrait" or "Landscape".' },
] as const
