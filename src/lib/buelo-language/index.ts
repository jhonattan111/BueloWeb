// Buelo DSL language removed. Monaco editor uses native 'csharp' mode.
export const BUELO_LANGUAGE_ID = 'csharp'

import { registerDataCompletionProvider } from './csharpDataCompletions'

export function registerBueloLanguage(): void {
  registerDataCompletionProvider()
}
