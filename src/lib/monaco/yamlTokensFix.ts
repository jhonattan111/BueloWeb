import * as monaco from 'monaco-editor'
import { language as baseYamlLanguage } from 'monaco-editor/esm/vs/basic-languages/yaml/yaml.js'

// Why this exists: Monaco's built-in YAML Monarch grammar mis-tokenizes flow mappings whose
// values are quoted strings that contain a colon, e.g.:
//
//   - text: { value: "Period: {{ data.period }}", style: { size: 10, color: "#666666" } }
//
// In the flow-mapping ("object") state, the key-detection rule
// `/(?:".*?"|'.*?'|[^,\{\[]+?)(?=: )/` fires on `"Period` because the `: ` INSIDE the string
// looks like a key:value separator. That desyncs the quote/brace tracking: the opening `{`
// ends up unmatched (rendered red) and the later `#666666` is read as a `#` line comment
// (rendered green). Purely cosmetic — validation/rendering are unaffected — but confusing.
//
// Fix: consume quoted strings (`@flowScalars`) BEFORE the key-detection rule, so a quoted
// value is always taken whole and an inner colon can't be mistaken for a separator. We deep
// clone Monaco's grammar (fresh rule references — the originals are already compiled and shared
// with Monaco's own tokenizer) and only reorder the `object` state. Monaco is pinned to 0.54.x.

// The `object` (flow-mapping) state with `@flowScalars` moved ahead of the key rule.
const PATCHED_OBJECT_STATE: monaco.languages.IMonarchLanguageRule[] = [
  { include: '@whitespace' },
  { include: '@comment' },
  // Flow Mapping termination
  [/\}/, '@brackets', '@pop'],
  // Flow Mapping delimiter
  [/,/, 'delimiter.comma'],
  // Flow Mapping Key:Value delimiter
  [/:(?= )/, 'operators'],
  // Quoted scalars first: a quoted value is consumed whole, so a colon inside it is never
  // mistaken for a key:value separator (the bug this module fixes).
  { include: '@flowScalars' },
  // Flow Mapping Key:Value key
  [/(?:".*?"|'.*?'|[^,\{\[]+?)(?=: )/, 'type'],
  // Start Flow Style
  { include: '@flowCollections' },
  // Scalar Data types
  { include: '@tagHandle' },
  { include: '@anchor' },
  { include: '@flowNumber' },
  // Other value (keyword or string)
  [/[^\},]+/, { cases: { '@keywords': 'keyword', '@default': 'string' } }],
]

let applied = false

export function fixYamlTokenizer(): void {
  if (applied) return
  applied = true

  const grammar = structuredClone(baseYamlLanguage) as monaco.languages.IMonarchLanguage
  ;(grammar.tokenizer as Record<string, monaco.languages.IMonarchLanguageRule[]>).object =
    PATCHED_OBJECT_STATE

  // Monaco registers the built-in grammar lazily when the language is first used. Register on
  // that event so ours wins, and also eagerly in case 'yaml' is already loaded.
  monaco.languages.onLanguage('yaml', () => {
    monaco.languages.setMonarchTokensProvider('yaml', grammar)
  })
  monaco.languages.setMonarchTokensProvider('yaml', grammar)
}
