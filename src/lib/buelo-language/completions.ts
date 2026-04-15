import * as monaco from 'monaco-editor'
import { listTemplates } from '@/services/templateService'
import { CONTEXT_VARS, PAGE_SIZES, ORIENTATIONS, SETTINGS_KEYS } from './spec'
import { DIRECTIVE_SNIPPETS, SECTION_SNIPPETS, toCompletionItem } from './snippets'

// 30-second cache for partial templates
let partialsCache: string[] | null = null
let partialsCacheTime = 0
const CACHE_TTL = 30_000

async function getPartialNames(): Promise<string[]> {
  const now = Date.now()
  if (partialsCache && now - partialsCacheTime < CACHE_TTL) {
    return partialsCache
  }
  try {
    const templates = await listTemplates()
    partialsCache = templates
      .filter((t) => (t as { mode?: string }).mode === 'Partial')
      .map((t) => t.name)
    partialsCacheTime = now
  } catch {
    partialsCache = partialsCache ?? []
  }
  return partialsCache
}

function makeRange(
  _model: monaco.editor.ITextModel,
  position: monaco.Position,
  wordInfo: monaco.editor.IWordAtPosition | null,
): monaco.IRange {
  if (wordInfo) {
    return {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: wordInfo.startColumn,
      endColumn: wordInfo.endColumn,
    }
  }
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: position.column,
    endColumn: position.column,
  }
}

export function buildCompletionProvider(): monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['@', '.', '"'],

    async provideCompletionItems(model, position) {
      const lineUntilCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })

      const wordInfo = model.getWordUntilPosition(position)
      const range = makeRange(model, position, wordInfo)

      // ── @directive completions ──────────────────────────────────────────────
      if (/^\s*@\w*$/.test(lineUntilCursor)) {
        const directiveRange: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: lineUntilCursor.lastIndexOf('@') + 1,
          endColumn: position.column,
        }
        return {
          suggestions: DIRECTIVE_SNIPPETS.map((s) =>
            toCompletionItem(s, directiveRange, monaco.languages.CompletionItemKind.Snippet),
          ),
        }
      }

      // ── page.* section completions ──────────────────────────────────────────
      if (/\bpage\.$/.test(lineUntilCursor)) {
        const memberRange: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column,
          endColumn: position.column,
        }
        return {
          suggestions: SECTION_SNIPPETS.filter((s) => s.label.startsWith('page.')).map((s) =>
            toCompletionItem(s, memberRange, monaco.languages.CompletionItemKind.Method),
          ),
        }
      }

      // ── @settings key completions ───────────────────────────────────────────
      const settingsBlockMatch = /^\s*@settings\s*\{[^}]*$/.test(
        model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 10),
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        }),
      )
      if (settingsBlockMatch) {
        // After "size:" → suggest PAGE_SIZES
        if (/size:\s*"?$/.test(lineUntilCursor)) {
          return {
            suggestions: PAGE_SIZES.map((size) => ({
              label: size,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: size,
              range,
            })),
          }
        }
        // After "orientation:" → suggest ORIENTATIONS
        if (/orientation:\s*"?$/.test(lineUntilCursor)) {
          return {
            suggestions: ORIENTATIONS.map((o) => ({
              label: o,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: o,
              range,
            })),
          }
        }
        // Suggest settings keys
        return {
          suggestions: SETTINGS_KEYS.map((k) => ({
            label: k.name + ':',
            kind: monaco.languages.CompletionItemKind.Property,
            documentation: k.doc,
            insertText: k.name + ': "${1}"',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          })),
        }
      }

      // ── @import ... from "<partial>" completions ────────────────────────────
      if (/@import\b.+from\s+"[^"]*$/.test(lineUntilCursor)) {
        const names = await getPartialNames()
        const quoteStart = lineUntilCursor.lastIndexOf('"') + 1
        const partialRange: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: quoteStart + 1,
          endColumn: position.column,
        }
        return {
          suggestions: names.map((name) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Reference,
            insertText: name,
            range: partialRange,
          })),
        }
      }

      // ── Context variable completions ────────────────────────────────────────
      if (/\b(data|ctx|helpers)$/.test(lineUntilCursor) || wordInfo.word === '') {
        return {
          suggestions: CONTEXT_VARS.map((v) => ({
            label: v.name,
            kind: monaco.languages.CompletionItemKind.Variable,
            detail: v.type,
            documentation: v.doc,
            insertText: v.name,
            range,
          })),
        }
      }

      return { suggestions: [] }
    },
  }
}
