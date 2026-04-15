import * as monaco from 'monaco-editor'
import { DIRECTIVES, SECTIONS, CONTEXT_VARS } from './spec'

function md(value: string): monaco.IMarkdownString {
  return { value, isTrusted: true }
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

      // Check for @directive hover: look for '@' immediately before the word
      const charBefore = lineText[word.startColumn - 2] // startColumn is 1-based
      const isDirectiveToken = charBefore === '@'
      if (isDirectiveToken) {
        const directive = DIRECTIVES.find((d) => d.name === word.word)
        if (directive) {
          return {
            range,
            contents: [
              md(`**@${directive.name}**`),
              md(directive.doc),
              md(`\`\`\`buelo\n${directive.syntax}\n\`\`\``),
            ],
          }
        }
      }

      // Check for context variables
      const contextVar = CONTEXT_VARS.find((v) => v.name === word.word)
      if (contextVar) {
        return {
          range,
          contents: [
            md(`**${contextVar.name}** — \`${contextVar.type}\``),
            md(contextVar.doc),
          ],
        }
      }

      // Check for page.Section hover: look for "page." before the word
      const prefixStart = word.startColumn - 6 // length of "page." = 5 chars at 1-based offset
      if (prefixStart >= 0) {
        const prefix = lineText.substring(prefixStart - 1, word.startColumn - 1)
        if (prefix === 'page.') {
          const sectionKey = `page.${word.word}()`
          const section = SECTIONS.find((s) => s.name === sectionKey)
          if (section) {
            return {
              range,
              contents: [md(`**${section.name}**`), md(section.doc)],
            }
          }
        }
      }

      return null
    },
  }
}
