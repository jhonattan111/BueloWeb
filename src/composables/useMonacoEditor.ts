import * as monaco from 'monaco-editor'
import { onMounted, onUnmounted, type Ref } from 'vue'

export function useMonacoEditor(
  containerRef: Ref<HTMLElement | null>,
  language: string,
  initialValue: string,
) {
  let editor: monaco.editor.IStandaloneCodeEditor | null = null

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
    })
  })

  onUnmounted(() => {
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
    editor?.onDidChangeModelContent(cb)
  }

  return { getValue, setValue, onDidChangeContent }
}
