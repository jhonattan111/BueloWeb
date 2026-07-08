import * as monaco from 'monaco-editor'

import { hexToRgba, rgbaToHex, scanLineColors } from './colorFormat'

// Why this exists: Monaco's built-in color picker (`defaultColorDecorators`) writes colors
// back as 8-digit RGBA (`#RRGGBBAA`) — e.g. white becomes `#ffffffff`. Buelo colors are
// authored as 6-digit `#RRGGBB` and QuestPDF reads 8-digit hex as ARGB (`#AARRGGBB`), not
// RGBA, so the picker's output silently corrupts the rendered color. This provider replaces
// the default: it still renders the inline swatches, but its color presentation always emits
// canonical 6-digit `#RRGGBB` (alpha dropped). Editors must be created with
// `defaultColorDecorators: 'never'` so Monaco's built-in RGBA picker doesn't compete.

const bueloColorProvider: monaco.languages.DocumentColorProvider = {
  provideDocumentColors(model) {
    const colors: monaco.languages.IColorInformation[] = []
    const lineCount = model.getLineCount()
    for (let line = 1; line <= lineCount; line++) {
      for (const { hex, startColumn, length } of scanLineColors(model.getLineContent(line))) {
        colors.push({
          color: hexToRgba(hex),
          range: new monaco.Range(line, startColumn, line, startColumn + length),
        })
      }
    }
    return colors
  },
  provideColorPresentations(_model, colorInformation) {
    return [{ label: rgbaToHex(colorInformation.color) }]
  },
}

let registered = false

/**
 * Registers the canonical 6-digit color provider for the declarative YAML and C# editors.
 * Idempotent.
 */
export function registerBueloColorProvider(): void {
  if (registered) return
  registered = true
  for (const languageId of ['yaml', 'csharp']) {
    monaco.languages.registerColorProvider(languageId, bueloColorProvider)
  }
}
