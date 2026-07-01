import { cn, downloadBlob } from '@/lib/utils'

describe('cn', () => {
  it('merges class names, dropping falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })

  it('resolves conflicting tailwind utility classes to the last one (tailwind-merge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('supports arrays and object syntax like clsx', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c')
  })
})

describe('downloadBlob', () => {
  it('creates an object URL, clicks a temporary anchor with the filename, then revokes the URL', () => {
    const createObjectURL = vi.fn(() => 'blob:fake-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const clickSpy = vi.fn()
    const anchor = document.createElement('a')
    vi.spyOn(anchor, 'click').mockImplementation(clickSpy)
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    const blob = new Blob(['hello'])
    downloadBlob(blob, 'report.pdf')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(anchor.href).toBe('blob:fake-url')
    expect(anchor.download).toBe('report.pdf')
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')

    createElementSpy.mockRestore()
    vi.unstubAllGlobals()
  })
})
