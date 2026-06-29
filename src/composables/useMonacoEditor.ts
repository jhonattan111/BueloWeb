import * as monaco from 'monaco-editor'
import { onMounted, onUnmounted, type Ref } from 'vue'
import { BUELO_LANGUAGE_ID } from '@/lib/buelo-language'

export function useMonacoEditor(
  containerRef: Ref<HTMLElement | null>,
  language: string,
  initialValue: string,
  options?: { readOnly?: boolean; path?: string },
) {
  let editor: monaco.editor.IStandaloneCodeEditor | null = null
  // Model we explicitly created (named-URI path). The editor does not own a
  // model passed in via `model`, so we must dispose it ourselves on unmount.
  let ownedModel: monaco.editor.ITextModel | null = null
  const pendingChangeCallbacks: Array<() => void> = []
  const changeDisposables: monaco.IDisposable[] = []

  onMounted(() => {
    if (!containerRef.value) return

    const normalizedLanguage = language === BUELO_LANGUAGE_ID ? BUELO_LANGUAGE_ID : language

    const baseOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      theme: 'vs-dark',
      fontSize: 13,
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: 2,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true,
      },
      suggestOnTriggerCharacters: true,
      wordBasedSuggestions: 'off',
      readOnly: options?.readOnly ?? false,
    }

    if (options?.path) {
      // A named model URI (e.g. file:///fatura.report.yml) is what lets monaco-yaml
      // and the JSON-schema layer bind schemas by the `*.<kind>.yml` filename
      // convention — an anonymous `inmemory://model/N` URI never matches fileMatch.
      const uri = monaco.Uri.file(options.path)
      monaco.editor.getModel(uri)?.dispose()
      ownedModel = monaco.editor.createModel(initialValue, normalizedLanguage, uri)
      editor = monaco.editor.create(containerRef.value, { model: ownedModel, ...baseOptions })
    } else {
      editor = monaco.editor.create(containerRef.value, {
        value: initialValue,
        language: normalizedLanguage,
        ...baseOptions,
      })
    }

    // Register callbacks queued before Monaco editor creation.
    for (const cb of pendingChangeCallbacks) {
      changeDisposables.push(editor.onDidChangeModelContent(cb))
    }
    pendingChangeCallbacks.length = 0
  })

  onUnmounted(() => {
    for (const disposable of changeDisposables) {
      disposable.dispose()
    }
    changeDisposables.length = 0
    editor?.dispose()
    editor = null
    ownedModel?.dispose()
    ownedModel = null
  })

  function getValue(): string {
    return editor?.getValue() ?? ''
  }

  function setValue(val: string): void {
    if (editor && editor.getValue() !== val) {
      editor.setValue(val)
    }
  }

  function onDidChangeContent(cb: () => void): void {
    if (!editor) {
      pendingChangeCallbacks.push(cb)
      return
    }

    changeDisposables.push(editor.onDidChangeModelContent(cb))
  }

  function getModel(): monaco.editor.ITextModel | null {
    return editor?.getModel() ?? null
  }

  return { getValue, setValue, onDidChangeContent, getModel }
}
