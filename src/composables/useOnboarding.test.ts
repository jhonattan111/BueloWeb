vi.mock('@/services/workspaceService', () => ({
  createFile: vi.fn(),
  createFolder: vi.fn(),
}))
// presetFileSettings lives in useReportSettings, which transitively imports Monaco — stub it.
vi.mock('@/composables/useReportSettings', () => ({ presetFileSettings: vi.fn() }))

import * as ws from '@/services/workspaceService'
import { presetFileSettings } from '@/composables/useReportSettings'
import { useOnboarding } from '@/composables/useOnboarding'
import { ONBOARDING_FILES, ONBOARDING_OPEN_FIRST } from '@/lib/onboardingExamples'

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('maybeShow opens the modal on first run, not after onboarding', () => {
    const ob = useOnboarding()
    ob.maybeShow()
    expect(ob.showWelcome.value).toBe(true)

    ob.dismiss() // marks onboarded
    const ob2 = useOnboarding()
    ob2.maybeShow()
    expect(ob2.showWelcome.value).toBe(false)
  })

  it('createExamples creates the folder + every showcase file, presets settings, marks onboarded', async () => {
    vi.mocked(ws.createFolder).mockResolvedValue(undefined)
    vi.mocked(ws.createFile).mockResolvedValue({} as never)

    const ob = useOnboarding()
    const first = await ob.createExamples()

    expect(ws.createFolder).toHaveBeenCalledWith('examples')
    expect(vi.mocked(ws.createFile).mock.calls.length).toBe(ONBOARDING_FILES.length)
    expect(presetFileSettings).toHaveBeenCalled()
    expect(first).toBe(ONBOARDING_OPEN_FIRST)
    expect(ob.showWelcome.value).toBe(false)
  })
})
