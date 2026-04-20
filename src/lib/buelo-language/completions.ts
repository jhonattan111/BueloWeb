import * as monaco from 'monaco-editor'
import {
  LAYOUT_COMPONENTS,
  CONTENT_COMPONENTS,
  STYLE_PROPERTIES,
  TABLE_COLUMN_PROPERTIES,
  PAGE_SIZES,
  ORIENTATIONS,
  EXPRESSION_VARS,
  DIRECTIVES,
} from './spec'
import { COMPONENT_SNIPPETS } from './snippets'
import { listWorkspaceFilePaths } from '@/services/workspaceService'

// 30-second cache
let workspacePathsCache: string[] | null = null
let workspacePathsCacheTime = 0
const CACHE_TTL = 30_000

async function getWorkspacePaths(): Promise<string[]> {
  const now = Date.now()
  if (workspacePathsCache && now - workspacePathsCacheTime < CACHE_TTL) {
    return workspacePathsCache
  }

  try {
    workspacePathsCache = await listWorkspaceFilePaths()
    workspacePathsCacheTime = now
    return workspacePathsCache
  } catch {
    return []
  }
}

function filterPathCompletions(paths: string[], prefix: string): string[] {
  if (!prefix.trim()) return paths
  return paths.filter((path) => path.toLowerCase().includes(prefix.toLowerCase()))
}

function makeRange(
  position: monaco.Position,
  wordInfo: monaco.editor.IWordAtPosition | null,
): monaco.IRange {
  if (wordInfo && wordInfo.word) {
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

/** Count leading spaces to determine indent level (0 = col 0, 1 = 2 spaces, 2 = 4 spaces) */
function indentLevel(line: string): number {
  const spaces = line.match(/^( *)/)?.[1].length ?? 0
  return Math.floor(spaces / 2)
}

export function buildCompletionProvider(): monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: [':', '{', '"', '@', '\n'],

    async provideCompletionItems(model, position) {
      const lineUntilCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })

      const wordInfo = model.getWordUntilPosition(position)
      const range = makeRange(position, wordInfo)

      // ── Template expression completions inside {{ … }} ──────────────────
      if (/\{\{[^}]*$/.test(lineUntilCursor)) {
        return {
          suggestions: EXPRESSION_VARS.map((v) => ({
            label: v.name,
            kind: monaco.languages.CompletionItemKind.Variable,
            documentation: v.doc,
            insertText: v.name,
            range,
          })),
        }
      }

      // ── import ... from "…" workspace paths ───────────────────────────
      if (/^import\s.+from\s+"[^"]*$/.test(lineUntilCursor)) {
        const typed = lineUntilCursor.match(/"([^"]*)$/)?.[1] ?? ''
        const names = filterPathCompletions(
          (await getWorkspacePaths()).filter((path) =>
            ['.buelo', '.json', '.cs', '.csx'].some((ext) => path.toLowerCase().endsWith(ext)),
          ),
          typed,
        )
        const quoteStart = lineUntilCursor.lastIndexOf('"') + 2
        const fileRange: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: quoteStart,
          endColumn: position.column,
        }
        return {
          suggestions: names.map((name) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.File,
            insertText: name,
            range: fileRange,
          })),
        }
      }

      // ── @data from "…" workspace json paths ───────────────────────────
      if (/^@data\s+from\s+"[^"]*$/.test(lineUntilCursor)) {
        const typed = lineUntilCursor.match(/"([^"]*)$/)?.[1] ?? ''
        const names = filterPathCompletions(
          (await getWorkspacePaths()).filter((path) => path.toLowerCase().endsWith('.json')),
          typed,
        )
        const quoteStart = lineUntilCursor.lastIndexOf('"') + 2
        const fileRange: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: quoteStart,
          endColumn: position.column,
        }
        return {
          suggestions: names.map((name) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.File,
            insertText: name,
            range: fileRange,
          })),
        }
      }

      const currentLine = model.getLineContent(position.lineNumber)
      const level = indentLevel(currentLine)

      // ── @settings block: size: and orientation: values ─────────────────
      const contextBlock10 = model.getValueInRange({
        startLineNumber: Math.max(1, position.lineNumber - 10),
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })
      if (/@settings\b/.test(contextBlock10)) {
        if (/size:\s*$/.test(lineUntilCursor)) {
          return {
            suggestions: PAGE_SIZES.map((s) => ({
              label: s,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: s,
              range,
            })),
          }
        }
        if (/orientation:\s*$/.test(lineUntilCursor)) {
          return {
            suggestions: ORIENTATIONS.map((o) => ({
              label: o,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: o,
              range,
            })),
          }
        }
      }

      // ── style: property values ──────────────────────────────────────────
      const stylePropMatch = lineUntilCursor.match(/^\s+([\w-]+):\s*$/)
      if (stylePropMatch) {
        const propName = stylePropMatch[1]
        const styleProp = STYLE_PROPERTIES.find((p) => p.name === propName)
        if (styleProp && styleProp.values.length > 0) {
          return {
            suggestions: styleProp.values.map((v) => ({
              label: v,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: v,
              range,
            })),
          }
        }
        const tableColProp = TABLE_COLUMN_PROPERTIES.find((p) => p.name === propName)
        if (tableColProp && tableColProp.values.length > 0) {
          return {
            suggestions: tableColProp.values.map((v) => ({
              label: v,
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: v,
              range,
            })),
          }
        }
      }

      // ── Inside style: block (level 2+) ──────────────────────────────────
      const isInsideStyle = (() => {
        for (let ln = position.lineNumber - 1; ln >= 1; ln--) {
          const l = model.getLineContent(ln)
          if (/^\s+style:\s*$/.test(l)) return true
          if (/^\S/.test(l)) break
        }
        return false
      })()

      if (isInsideStyle && level >= 2) {
        return {
          suggestions: STYLE_PROPERTIES.map((p) => ({
            label: p.name + ':',
            kind: monaco.languages.CompletionItemKind.Property,
            documentation: p.doc,
            insertText: `${p.name}: ${p.values.length === 1 ? p.values[0] : '$1'}`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          })),
        }
      }

      // ── Inside columns: list items ──────────────────────────────────────
      const isInsideColumns = (() => {
        for (let ln = position.lineNumber - 1; ln >= 1; ln--) {
          const l = model.getLineContent(ln)
          if (/^\s+columns:\s*$/.test(l)) return true
          if (/^\S/.test(l)) break
        }
        return false
      })()

      if (isInsideColumns && /^\s+-\s/.test(currentLine)) {
        return {
          suggestions: TABLE_COLUMN_PROPERTIES.map((p) => ({
            label: p.name + ':',
            kind: monaco.languages.CompletionItemKind.Property,
            documentation: p.doc,
            insertText: `${p.name}: $1`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          })),
        }
      }

      // ── Content components (indented, level 1) ──────────────────────────
      if (level >= 1 && /^\s+$/.test(lineUntilCursor)) {
        const contentSuggestions = CONTENT_COMPONENTS.map((c) => {
          const snip = COMPONENT_SNIPPETS.find((s) => s.label === c.name)
          return {
            label: c.name + ':',
            kind: monaco.languages.CompletionItemKind.Keyword,
            documentation: c.doc,
            insertText: snip?.insertText ?? `${c.name}:\n  `,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          }
        })
        return { suggestions: contentSuggestions }
      }

      // ── Top-level: layout components + directives ───────────────────────
      if (level === 0 && /^\s*$/.test(lineUntilCursor)) {
        const layoutSuggestions = [
          ...LAYOUT_COMPONENTS.map((c) => {
            const snip = COMPONENT_SNIPPETS.find((s) => s.label === c.name)
            return {
              label: c.name + ':',
              kind: monaco.languages.CompletionItemKind.Keyword,
              documentation: c.doc,
              insertText: snip?.insertText ?? `${c.name}:\n  `,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            }
          }),
          ...DIRECTIVES.map((d) => {
            const snip = COMPONENT_SNIPPETS.find((s) => s.label === d.name)
            return {
              label: d.name,
              kind: monaco.languages.CompletionItemKind.Keyword,
              documentation: d.doc,
              insertText: snip?.insertText ?? d.name,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            }
          }),
        ]
        return { suggestions: layoutSuggestions }
      }

      return { suggestions: [] }
    },
  }
}

