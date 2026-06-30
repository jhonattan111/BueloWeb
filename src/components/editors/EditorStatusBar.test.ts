import { mount } from '@vue/test-utils'
import EditorStatusBar from '@/components/editors/EditorStatusBar.vue'

const baseProps = {
  isValidating: false,
  errorCount: 0,
  warningCount: 0,
  extension: '.yml',
  language: 'yaml',
  lineCount: 10,
  cursorLine: 3,
  cursorColumn: 5,
}

describe('EditorStatusBar', () => {
  it('shows "No problems" and does not emit on click when clean', async () => {
    const wrapper = mount(EditorStatusBar, { props: { ...baseProps } })
    expect(wrapper.text()).toContain('No problems')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('goToFirstError')).toBeUndefined()
  })

  it('labels a single warning (no plural) and emits goToFirstError on click', async () => {
    const wrapper = mount(EditorStatusBar, { props: { ...baseProps, warningCount: 1 } })
    expect(wrapper.text()).toContain('1 warning')
    expect(wrapper.text()).not.toContain('1 warnings')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('goToFirstError')).toHaveLength(1)
  })

  it('pluralizes and combines errors + warnings', () => {
    const wrapper = mount(EditorStatusBar, {
      props: { ...baseProps, errorCount: 2, warningCount: 1 },
    })
    expect(wrapper.text()).toContain('2 errors, 1 warning')
  })

  it('shows the validating state', () => {
    const wrapper = mount(EditorStatusBar, { props: { ...baseProps, isValidating: true } })
    expect(wrapper.text()).toContain('Validating')
  })

  it('renders the language and cursor position', () => {
    const wrapper = mount(EditorStatusBar, { props: { ...baseProps } })
    // The language is uppercased via CSS only, so the text content stays lowercase.
    expect(wrapper.text()).toContain('yaml')
    expect(wrapper.text()).toContain('Ln 3, Col 5')
  })
})
