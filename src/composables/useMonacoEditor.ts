import * as monaco from 'monaco-editor'
import { onMounted, onUnmounted, type Ref } from 'vue'

export function useMonacoEditor(
  containerRef: Ref<HTMLElement | null>,
  language: string,
  initialValue: string,
  options?: { readOnly?: boolean },
) {
  let editor: monaco.editor.IStandaloneCodeEditor | null = null
  const pendingChangeCallbacks: Array<() => void> = []
  const changeDisposables: monaco.IDisposable[] = []

  onMounted(() => {
    if (!containerRef.value) return

    editor = monaco.editor.create(containerRef.value, {
      value: initialValue,
      language,
      theme: 'vs-dark',
      fontSize: 13,
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: 2,
      readOnly: options?.readOnly ?? false,
    })

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
