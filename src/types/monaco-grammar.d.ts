// Type shim for Monaco's built-in YAML Monarch grammar (no type declarations ship for the
// deep `basic-languages` path). Used by `lib/monaco/yamlTokensFix.ts` to patch one tokenizer
// state. Monaco is pinned to 0.54.x, so this path is stable.
declare module 'monaco-editor/esm/vs/basic-languages/yaml/yaml.js' {
  import type * as monaco from 'monaco-editor'
  export const conf: monaco.languages.LanguageConfiguration
  export const language: monaco.languages.IMonarchLanguage
}
