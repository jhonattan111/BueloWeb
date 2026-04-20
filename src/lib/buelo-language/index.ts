import * as monaco from 'monaco-editor'
import { buildTokenizer } from './tokenizer'
import { buildCompletionProvider } from './completions'
import { buildHoverProvider } from './hover'

export function registerBueloLanguage(): void {
  monaco.languages.register({
    id: 'buelo',
    extensions: ['.buelo'],
    aliases: ['Buelo', 'buelo'],
  })

  monaco.languages.setMonarchTokensProvider('buelo', buildTokenizer())
  monaco.languages.registerCompletionItemProvider('buelo', buildCompletionProvider())
  monaco.languages.registerHoverProvider('buelo', buildHoverProvider())
}
