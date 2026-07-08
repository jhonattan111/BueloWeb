import { describe, it, expect } from 'vitest'
import { hexToRgba, rgbaToHex, scanLineColors } from './colorFormat'

describe('colorFormat', () => {
  describe('rgbaToHex', () => {
    it('emits canonical 6-digit hex for opaque white (regression: not #ffffffff)', () => {
      expect(rgbaToHex({ red: 1, green: 1, blue: 1, alpha: 1 })).toBe('#ffffff')
    })

    it('drops the alpha channel entirely, even when not fully opaque', () => {
      expect(rgbaToHex({ red: 1, green: 1, blue: 1, alpha: 0.5 })).toBe('#ffffff')
      expect(rgbaToHex({ red: 0, green: 0, blue: 0, alpha: 0 })).toBe('#000000')
    })

    it('rounds channels to two hex digits', () => {
      expect(rgbaToHex({ red: 29 / 255, green: 158 / 255, blue: 117 / 255, alpha: 1 })).toBe(
        '#1d9e75',
      )
    })
  })

  describe('hexToRgba', () => {
    it('parses 6-digit hex with full alpha', () => {
      expect(hexToRgba('#ffffff')).toEqual({ red: 1, green: 1, blue: 1, alpha: 1 })
    })

    it('parses the alpha byte from 8-digit RGBA hex', () => {
      expect(hexToRgba('#00000080').alpha).toBeCloseTo(128 / 255)
    })

    it('expands 3-digit shorthand', () => {
      expect(hexToRgba('#fff')).toEqual({ red: 1, green: 1, blue: 1, alpha: 1 })
    })

    it('round-trips an 8-digit RGBA value down to 6-digit hex', () => {
      expect(rgbaToHex(hexToRgba('#ffffffff'))).toBe('#ffffff')
    })
  })

  describe('scanLineColors', () => {
    it('finds a hex color inside a YAML style string', () => {
      const matches = scanLineColors('  - divider: { color: "#1D9E75", thickness: 2 }')
      expect(matches).toHaveLength(1)
      expect(matches[0].hex).toBe('#1D9E75')
      // 1-based column of the `#`
      expect(matches[0].startColumn).toBe(24)
      expect(matches[0].length).toBe(7)
    })

    it('finds multiple colors on one line', () => {
      const matches = scanLineColors('style: { background: "#F1F5F9", border: "1px #E2E8F0" }')
      expect(matches.map((m) => m.hex)).toEqual(['#F1F5F9', '#E2E8F0'])
    })

    it('returns nothing when the line has no color', () => {
      expect(scanLineColors('size: 12, bold: true')).toEqual([])
    })
  })
})
