// Pure color-format helpers for the Monaco color provider — no Monaco import, so they stay
// unit-testable. Buelo authors colors as canonical 6-digit `#RRGGBB`; QuestPDF reads 8-digit
// hex as ARGB (`#AARRGGBB`), not RGBA, so Monaco's default 8-digit RGBA picker output would
// silently corrupt colors. These helpers normalize everything back to `#RRGGBB`.

/** Matches the shape of Monaco's `languages.IColor` (channels are 0..1 floats). */
export interface RgbaColor {
  red: number
  green: number
  blue: number
  alpha: number
}

/** Hex color literal: `#RGB`, `#RRGGBB`, or `#RRGGBBAA`. */
export const HEX_COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g

export function hexToRgba(hex: string): RgbaColor {
  let body = hex.slice(1)
  if (body.length === 3) {
    body = body
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const red = parseInt(body.slice(0, 2), 16) / 255
  const green = parseInt(body.slice(2, 4), 16) / 255
  const blue = parseInt(body.slice(4, 6), 16) / 255
  const alpha = body.length === 8 ? parseInt(body.slice(6, 8), 16) / 255 : 1
  return { red, green, blue, alpha }
}

function channelHex(value: number): string {
  return Math.round(value * 255)
    .toString(16)
    .padStart(2, '0')
}

/** Canonical 6-digit `#RRGGBB` — the format Buelo/QuestPDF expect. Alpha is intentionally dropped. */
export function rgbaToHex(color: RgbaColor): string {
  return `#${channelHex(color.red)}${channelHex(color.green)}${channelHex(color.blue)}`
}

export interface HexColorMatch {
  hex: string
  /** 1-based column where the `#` sits (Monaco column convention). */
  startColumn: number
  length: number
}

/** Finds every hex color literal in a single line of text. */
export function scanLineColors(text: string): HexColorMatch[] {
  const matches: HexColorMatch[] = []
  HEX_COLOR.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = HEX_COLOR.exec(text)) !== null) {
    matches.push({ hex: match[0], startColumn: match.index + 1, length: match[0].length })
  }
  return matches
}
