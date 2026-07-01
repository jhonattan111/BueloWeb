// Native Monaco web-worker wiring — replaces the abandoned `vite-plugin-monaco-editor`.
// Vite compiles each `?worker` import into a bundled Web Worker; we hand Monaco the right
// worker per language label via `self.MonacoEnvironment.getWorker`. monaco-yaml ships its
// own worker (schema validation/completion for the declarative editor).
//
// This module has side effects — import it once, before any editor/model is created
// (done first thing in `main.ts`).
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import YamlWorker from 'monaco-yaml/yaml.worker?worker'

// The editor only handles `csharp` (Monarch tokens, no worker), `json` and `yaml`, so we ship
// just those workers. Any other label falls back to the base editor worker.
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    switch (label) {
      case 'json':
        return new JsonWorker()
      case 'yaml':
        return new YamlWorker()
      default:
        return new EditorWorker()
    }
  },
}
