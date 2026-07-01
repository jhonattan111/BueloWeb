import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PreviewPanel from '@/components/preview/PreviewPanel.vue'
import { useReportStore } from '@/stores/reportStore'

describe('PreviewPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    // downloadBlob() clicks a real <a href="blob:..."> — happy-dom would otherwise try
    // to navigate to it, which errors since the blob URL isn't a real resource here.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows the empty state before anything has been rendered', () => {
    const wrapper = mount(PreviewPanel)
    expect(wrapper.text()).toContain('Render a template to see the preview here.')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })

  it('shows the loading state while rendering', () => {
    const store = useReportStore()
    store.isRendering = true

    const wrapper = mount(PreviewPanel)
    expect(wrapper.text()).toContain('Rendering')
  })

  it('shows the error state when a render fails with no prior result', () => {
    const store = useReportStore()
    store.renderError = 'Boom: compile failed'

    const wrapper = mount(PreviewPanel)
    expect(wrapper.text()).toContain('Render failed')
    expect(wrapper.text()).toContain('Boom: compile failed')
  })

  it('renders a PDF iframe pointing at an object URL once a PDF result lands', async () => {
    const store = useReportStore()
    const wrapper = mount(PreviewPanel)

    store.resultBlob = new Blob(['%PDF'])
    store.resultContentType = 'application/pdf'
    store.resultFileExtension = '.pdf'
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(URL.createObjectURL).toHaveBeenCalledWith(store.resultBlob)
    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('src')).toBe('blob:fake-url')
  })

  it('shows the "File ready" download card for a non-PDF (excel) result', async () => {
    const store = useReportStore()
    const wrapper = mount(PreviewPanel)

    store.resultBlob = new Blob(['xlsx'])
    store.resultContentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    store.resultFileExtension = '.xlsx'
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('File ready')
    expect(wrapper.text()).toContain('report.xlsx')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })

  it('revokes the previous object URL when the result blob changes', async () => {
    const store = useReportStore()
    const wrapper = mount(PreviewPanel)

    store.resultBlob = new Blob(['%PDF-1'])
    store.resultContentType = 'application/pdf'
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    store.resultBlob = new Blob(['%PDF-2'])
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })
})
