// Buelo DSL language removed. Monaco editor uses native 'csharp' mode.
// Declarative authoring uses native 'yaml' with JSON Schemas served by the API.
export const BUELO_LANGUAGE_ID = 'csharp'

import { registerDataCompletionProvider } from './csharpDataCompletions'
import { configureBueloYamlSchemas } from './yamlSchemaSetup'
import { registerBueloColorProvider } from '@/lib/monaco/colorProvider'

export function registerBueloLanguage(): void {
  registerDataCompletionProvider()
  // Inline color swatches that write canonical 6-digit `#RRGGBB` (not Monaco's default RGBA).
  registerBueloColorProvider()
  // Bind the declarative YAML schemas (best-effort; needs the API running to fetch them).
  void configureBueloYamlSchemas()
}
