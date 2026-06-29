import * as monaco from 'monaco-editor'
import { onMounted, onUnmounted, type Ref } from 'vue'
import { BUELO_LANGUAGE_ID } from '@/lib/buelo-language'

// Monotonic id so each editor instance gets a distinct model URI. The app renders
// the editor twice (AppLayout's desktop + mobile <main>s), so two instances of the
// same file must not share one named model URI — otherwise they clobber each other's
// model and one editor ends up blank.
let modelUriSeq = 0

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
  let resizeObserver: ResizeObserver | null = null
  const layoutTimers: number[] = []
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
      // A named model URI is what lets monaco-yaml bind schemas by the `*.<kind>.yml`
      // filename convention — an anonymous `inmemory://model/N` URI never matches
      // fileMatch. The unique `buelo-<n>` segment keeps each editor instance's URI
      // distinct while preserving the real filename as the basename (so fileMatch
      // still matches): e.g. file:///buelo-3/fatura.report.yml.
      const uri = monaco.Uri.file(`/buelo-${modelUriSeq++}/${options.path}`)
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

    // Monaco can render blank when created in a momentarily 0-sized container.
    // This editor is mounted twice (AppLayout's desktop + mobile <main>s, one
    // hidden), and `automaticLayout` doesn't reliably repaint on the 0->N size
    // transition — leaving the visible editor empty. Force a relayout whenever the
    // container actually has size.
    const relayout = (): void => {
      const el = containerRef.value
      if (editor && el && el.clientHeight > 0 && el.clientWidth > 0) editor.layout()
    }
    // Nudge a few times after creation: a single early layout() lands before Monaco
    // finishes initializing and is a no-op, so the content stays blank.
    requestAnimationFrame(relayout)
    for (const delay of [0, 120, 360]) layoutTimers.push(window.setTimeout(relayout, delay))
    resizeObserver = new ResizeObserver(relayout)
    resizeObserver.observe(containerRef.value)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    for (const id of layoutTimers) clearTimeout(id)
    layoutTimers.length = 0
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
