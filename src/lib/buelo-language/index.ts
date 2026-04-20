import * as monaco from 'monaco-editor'
import { buildTokenizer } from './tokenizer'
import { buildCompletionProvider } from './completions'
import { buildHoverProvider } from './hover'

export const BUELO_LANGUAGE_ID = 'buelo'

export function registerBueloLanguage(): void {
  monaco.languages.register({
    id: BUELO_LANGUAGE_ID,
    extensions: ['.buelo'],
    aliases: ['Buelo', 'buelo'],
  })

  monaco.languages.setMonarchTokensProvider(BUELO_LANGUAGE_ID, buildTokenizer())
  monaco.languages.registerCompletionItemProvider(BUELO_LANGUAGE_ID, buildCompletionProvider())
  monaco.languages.registerHoverProvider(BUELO_LANGUAGE_ID, buildHoverProvider())
}
