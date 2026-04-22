import * as monaco from 'monaco-editor'

const INJECTED_MODEL_URI = 'inmemory://buelo/DataModel.cs'

/**
 * Injects C# type declarations into Monaco as a read-only extra model.
 * Creates the model on first call; subsequent calls update the content.
 * Pass null/empty string to clear previously injected declarations.
 */
export function injectDataTypeDeclarations(csharpSource: string | null): void {
  const uri = monaco.Uri.parse(INJECTED_MODEL_URI)
  const existing = monaco.editor.getModel(uri)

  if (!csharpSource) {
    existing?.dispose()
    return
  }

  if (existing) {
    existing.setValue(csharpSource)
  } else {
    monaco.editor.createModel(csharpSource, 'csharp', uri)
  }
}
