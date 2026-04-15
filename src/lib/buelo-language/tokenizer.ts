import type * as Monaco from 'monaco-editor'

export function buildTokenizer(): Monaco.languages.IMonarchLanguage {
  return {
    defaultToken: '',
    tokenPostfix: '.buelo',

    keywords: [
      'var', 'string', 'int', 'bool', 'double', 'float', 'decimal',
      'return', 'if', 'else', 'for', 'foreach', 'while', 'switch', 'case',
      'using', 'new', 'null', 'true', 'false', 'void', 'class', 'record',
      'public', 'private', 'protected', 'static', 'readonly', 'const',
    ],

    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^',
      '%', '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
      '^=', '%=', '<<=', '>>=', '>>>=', '=>',
    ],

    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    tokenizer: {
      root: [
        // Buelo directives (must come before identifier rule)
        [/@(import|data|settings|schema|helper)\b/, 'keyword.directive'],

        // Page section members: page.Header / page.Content / page.Footer / page.Size / page.Margin
        [/(page)(\.)([A-Z][a-zA-Z]*)/, ['keyword.section', 'delimiter', 'keyword.section']],

        // Line comments
        [/\/\/.*$/, 'comment'],

        // Block comments
        [/\/\*/, { token: 'comment', next: '@blockComment' }],

        // Strings
        [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

        // Interpolated / verbatim strings
        [/\$"/, { token: 'string.quote', next: '@istring' }],
        [/@"/, { token: 'string.quote', next: '@verbatimString' }],

        // Numbers
        [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],

        // Identifiers and keywords
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          },
        ],

        // Brackets
        [/[{}()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],

        // Delimiters
        [/[;,.]/, 'delimiter'],

        // Operators
        [
          /@symbols/,
          {
            cases: {
              '@operators': 'operator',
              '@default': '',
            },
          },
        ],

        // Whitespace
        [/\s+/, ''],
      ],

      string: [
        [/[^"\\]+/, 'string'],
        [/\\./, 'string.escape.invalid'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
      ],

      istring: [
        [/[^"\\{]+/, 'string'],
        [/\\./, 'string.escape'],
        [/\{/, { token: 'string.escape', next: '@iembedded' }],
        [/"/, { token: 'string.quote', next: '@pop' }],
      ],

      iembedded: [
        [/\}/, { token: 'string.escape', next: '@pop' }],
        { include: 'root' },
      ],

      verbatimString: [
        [/[^"]+/, 'string'],
        [/""/, 'string'],
        [/"/, { token: 'string.quote', next: '@pop' }],
      ],

      blockComment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, { token: 'comment', next: '@pop' }],
        [/./, 'comment'],
      ],
    },
  }
}
