import * as monaco from 'monaco-editor'

export interface SnippetDef {
  label: string
  insertText: string
  documentation: string
}

export const DIRECTIVE_SNIPPETS: SnippetDef[] = [
  {
    label: '@import',
    insertText: '@import ${1|header,footer,content|} from "${2:partial-name}"',
    documentation: 'Imports a Partial template into a specific slot.',
  },
  {
    label: '@data',
    insertText: '@data from "${1:artefact-name}"',
    documentation: 'Binds a data artefact or JSON file to this template.',
  },
  {
    label: '@settings',
    insertText:
      '@settings {\n  size: "${1|A4,A3,A5,Letter,Legal|}";\n  margin: "${2:2cm}";\n  orientation: "${3|Portrait,Landscape|}";\n}',
    documentation: 'Configures page size, margin and orientation.',
  },
  {
    label: '@schema',
    insertText: '@schema record ${1:ModelName}(${2:string} ${3:Property});',
    documentation: 'Declares an inline typed record for data binding.',
  },
  {
    label: '@helper',
    insertText: '@helper ${1:HelperName}(${2:params}) => ${3:expression};',
    documentation: 'Declares an inline helper function.',
  },
  {
    label: '@helper from',
    insertText: '@helper from "${1:helpers-artefact-name}"',
    documentation: 'Loads helpers from a .helpers.cs artefact.',
  },
]

export const SECTION_SNIPPETS: SnippetDef[] = [
  {
    label: 'page =>',
    insertText: 'page => {\n  size: "${1|A4,A3,A5,Letter,Legal|}";\n  margin: "${2:2cm}";\n}',
    documentation: 'Optional page configuration block.',
  },
  {
    label: 'page.Header()',
    insertText: 'page.Header() {\n  $0\n}',
    documentation: 'Optional header section rendered on every page.',
  },
  {
    label: 'page.Content()',
    insertText: 'page.Content() {\n  $0\n}',
    documentation: 'Required main content section.',
  },
  {
    label: 'page.Footer()',
    insertText: 'page.Footer() {\n  $0\n}',
    documentation: 'Optional footer section rendered on every page.',
  },
]

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
