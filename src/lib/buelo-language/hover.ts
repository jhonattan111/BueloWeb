import * as monaco from 'monaco-editor'
import {
  LAYOUT_COMPONENTS,
  CONTENT_COMPONENTS,
  DIRECTIVES,
  STYLE_PROPERTIES,
  TABLE_COLUMN_PROPERTIES,
  EXPRESSION_VARS,
} from './spec'

function md(value: string): monaco.IMarkdownString {
  return { value, isTrusted: true }
}

/** Joins a multi-word component name for matching against the word under the cursor */
function wordMatchesComponent(word: string, componentName: string): boolean {
  // componentName may be multi-word like "report title"
  // word is a single Monaco word — match last segment or full name
  const parts = componentName.split(' ')
  return parts.includes(word) || componentName === word
}

export function buildHoverProvider(): monaco.languages.HoverProvider {
  return {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word) return null

      const lineText = model.getLineContent(position.lineNumber)

      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      // ── @-directives ───────────────────────────────────────────────────
      const charBefore = lineText[word.startColumn - 2]
      if (charBefore === '@') {
        const directive = DIRECTIVES.find((d) => d.name === `@${word.word}`)
        if (directive) {
          return {
            range,
            contents: [
              md(`**${directive.name}**`),
              md(directive.doc),
              md(`\`\`\`\n${directive.syntax}\n\`\`\``),
            ],
          }
        }
      }

      // ── Layout components ──────────────────────────────────────────────
      const layoutComp = LAYOUT_COMPONENTS.find((c) => wordMatchesComponent(word.word, c.name))
      if (layoutComp && /^[^\s]/.test(lineText)) {
        return {
          range,
          contents: [
            md(`**${layoutComp.name}** *(layout)*`),
            md(layoutComp.doc),
          ],
        }
      }

      // ── Content components ─────────────────────────────────────────────
      const contentComp = CONTENT_COMPONENTS.find((c) => wordMatchesComponent(word.word, c.name))
      if (contentComp && /^\s+/.test(lineText)) {
        return {
          range,
          contents: [
            md(`**${contentComp.name}** *(content)*`),
            md(contentComp.doc),
          ],
        }
      }

      // ── Style properties ───────────────────────────────────────────────
      const styleProp = STYLE_PROPERTIES.find((p) => p.name === word.word)
      if (styleProp) {
        const valuesNote =
          styleProp.values.length > 0
            ? `\n\nValues: \`${styleProp.values.join('` | `')}\``
            : ''
        return {
          range,
          contents: [
            md(`**${styleProp.name}** *(style property)*`),
            md(styleProp.doc + valuesNote),
          ],
        }
      }

      // ── Table column properties ────────────────────────────────────────
      const colProp = TABLE_COLUMN_PROPERTIES.find((p) => p.name === word.word)
      if (colProp) {
        return {
          range,
          contents: [
            md(`**${colProp.name}** *(column property)*`),
            md(colProp.doc),
          ],
        }
      }

      // ── Expression variables ───────────────────────────────────────────
      const exprVar = EXPRESSION_VARS.find((v) => v.name === word.word)
      if (exprVar) {
        return {
          range,
          contents: [
            md(`**{{ ${exprVar.name} }}** *(template variable)*`),
            md(exprVar.doc),
          ],
        }
      }

      return null
    },
  }
}

