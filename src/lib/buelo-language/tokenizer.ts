import type * as Monaco from 'monaco-editor'
import { LAYOUT_COMPONENTS, CONTENT_COMPONENTS } from './spec'

// Build alternation patterns from component name lists
const layoutPattern = LAYOUT_COMPONENTS.map((c) => c.name.replace(/ /g, '\\s+')).join('|')
const contentPattern = CONTENT_COMPONENTS.map((c) => c.name.replace(/ /g, '\\s+')).join('|')

export function buildTokenizer(): Monaco.languages.IMonarchLanguage {
  return {
    defaultToken: '',
    tokenPostfix: '.buelo',

    tokenizer: {
      root: [
        // ── Comments ──────────────────────────────────────────────────────
        [/^\s*#.*$/, 'comment'],

        // ── Import directive  (import { Func } from "name") ───────────────
        [/^import\b/, 'keyword.directive', '@importLine'],

        // ── @-directives ──────────────────────────────────────────────────
        [/@(data|settings|format)\b/, 'keyword.directive'],

        // ── Layout components at start of line (col 0 or after indent) ────
        [
          new RegExp(`^(${layoutPattern}):`),
          'keyword.layout',
        ],

        // ── Content components (indented) ─────────────────────────────────
        [
          new RegExp(`^\\s+(${contentPattern}):`),
          'keyword.content',
        ],

        // ── style: block opener ───────────────────────────────────────────
        [/^\s+style:/, 'keyword.section'],

        // ── Property keys (indented key:) ─────────────────────────────────
        [/^\s+[\w][\w-]*(?=\s*:)/, 'type.property'],

        // ── List items ────────────────────────────────────────────────────
        [/^\s+-\s/, 'operator'],

        // ── Template expressions {{ … }} ──────────────────────────────────
        [/\{\{[^}]*\}\}/, 'variable.expression'],

        // ── Color hex values ──────────────────────────────────────────────
        [/#[0-9A-Fa-f]{3,8}\b/, 'string.color'],

        // ── CSS-unit values ───────────────────────────────────────────────
        [/\d+(?:px|cm|in|mm|%|pt)\b/, 'number.unit'],

        // ── Boolean values ────────────────────────────────────────────────
        [/\b(true|false)\b/, 'keyword.bool'],

        // ── Numeric values ────────────────────────────────────────────────
        [/\b\d+(?:\.\d+)?\b/, 'number'],

        // ── Strings ───────────────────────────────────────────────────────
        [/"[^"]*"/, 'string'],

        // ── Whitespace ────────────────────────────────────────────────────
        [/\s+/, ''],
      ],

      importLine: [
        // { Func, Func2 }
        [/\{[^}]+\}/, 'variable.import'],
        // from keyword
        [/\bfrom\b/, 'keyword.directive'],
        // string
        [/"[^"]*"/, 'string'],
        // end of line
        [/$/, '', '@pop'],
        [/./, ''],
      ],
    },
  }
}

