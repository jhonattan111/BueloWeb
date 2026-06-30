import { setActivePinia, createPinia } from 'pinia'
import type { Template } from '@/types/template'

vi.mock('@/services/templateService', () => ({
  listTemplates: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}))

import * as templateService from '@/services/templateService'
import { useTemplateStore } from '@/stores/templateStore'

const tpl = (id: string, name: string): Template =>
  ({ id, name, template: '', mockData: {}, artefacts: [] }) as unknown as Template

describe('templateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchTemplates loads and normalizes (guid-like → [unnamed], trims real names)', async () => {
    vi.mocked(templateService.listTemplates).mockResolvedValue([
      tpl('abcdef12-1234-1234-89ab-1234567890ab', 'abcdef12-1234-1234-89ab-1234567890ab'),
      tpl('2', '  Real Name  '),
    ])
    const store = useTemplateStore()
    await store.fetchTemplates()

    expect(store.templates).toHaveLength(2)
    expect(store.templates[0].name).toMatch(/^\[unnamed-/)
    expect(store.templates[1].name).toBe('Real Name')
    expect(store.error).toBeNull()
  })

  it('fetchTemplates captures errors', async () => {
    vi.mocked(templateService.listTemplates).mockRejectedValue(new Error('down'))
    const store = useTemplateStore()
    await store.fetchTemplates()
    expect(store.error).toBe('down')
  })

  it('createTemplate pushes and selects the new template', async () => {
    vi.mocked(templateService.createTemplate).mockResolvedValue(tpl('9', 'Fresh'))
    const store = useTemplateStore()
    await store.createTemplate({ name: 'Fresh' })

    expect(store.templates.map((t) => t.id)).toContain('9')
    expect(store.activeTemplateId).toBe('9')
    expect(store.activeTemplate?.name).toBe('Fresh')
  })

  it('deleteTemplate removes it and reassigns the active id', async () => {
    vi.mocked(templateService.listTemplates).mockResolvedValue([tpl('1', 'A'), tpl('2', 'B')])
    vi.mocked(templateService.deleteTemplate).mockResolvedValue(undefined)
    const store = useTemplateStore()
    await store.fetchTemplates()
    store.selectTemplate('1')

    await store.deleteTemplate('1')

    expect(store.templates.map((t) => t.id)).toEqual(['2'])
    expect(store.activeTemplateId).toBe('2')
  })
})
