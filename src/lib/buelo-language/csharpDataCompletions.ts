import * as monaco from 'monaco-editor'

export interface DataProperty {
  name: string       // camelCase JSON key (as written in JSON)
  csharpName: string // PascalCase inferred C# name
  type: string       // inferred C# type string (e.g. "string", "int", "EmployeesItem[]")
}

let _currentProperties: DataProperty[] = []
let _providerDisposable: monaco.IDisposable | null = null

/**
 * Registers a Monaco completion provider for `data.` properties in the csharp language.
 * Should be called once at startup.
 */
export function registerDataCompletionProvider(): monaco.IDisposable {
  _providerDisposable = monaco.languages.registerCompletionItemProvider('csharp', {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const lineContent = model.getLineContent(position.lineNumber)
      const textBefore = lineContent.substring(0, position.column - 1)

      // Offer `data` as a variable completion when not after a dot
      const wordMatch = model.getWordUntilPosition(position)
      const word = wordMatch.word.toLowerCase()

      // After `data.` — offer property completions
      if (/\bdata\.$/.test(textBefore)) {
        if (_currentProperties.length === 0) return { suggestions: [] }

        return {
          suggestions: _currentProperties.map((prop) => ({
            label: prop.csharpName,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: prop.type,
            documentation: `Bound from JSON key "${prop.name}"`,
            insertText: prop.csharpName,
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column,
            ),
          })),
        }
      }

      // Suggest `data` variable itself
      if ('data'.startsWith(word) && word.length > 0) {
        return {
          suggestions: [
            {
              label: 'data',
              kind: monaco.languages.CompletionItemKind.Variable,
              documentation: 'Bound data from the selected .json data source',
              insertText: 'data',
              range: new monaco.Range(
                position.lineNumber,
                wordMatch.startColumn,
                position.lineNumber,
                wordMatch.endColumn,
              ),
            },
          ],
        }
      }

      return { suggestions: [] }
    },
  })

  return _providerDisposable
}

/**
 * Updates the data properties used by the completion provider.
 * Call with an empty array to clear completions.
 */
export function updateDataCompletions(properties: DataProperty[]): void {
  _currentProperties = properties
}
