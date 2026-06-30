import {
  ONBOARDING_FILES,
  ONBOARDING_FOLDER,
  ONBOARDING_OPEN_FIRST,
  ONBOARDING_REPORT_SETTINGS,
} from '@/lib/onboardingExamples'

describe('onboardingExamples', () => {
  it('every showcase file has a path and non-empty content', () => {
    expect(ONBOARDING_FILES.length).toBeGreaterThan(0)
    for (const file of ONBOARDING_FILES) {
      expect(file.path).toBeTruthy()
      expect(file.content.length).toBeGreaterThan(0)
    }
  })

  it('the Excel example report is preset to excel output', () => {
    const sales = ONBOARDING_REPORT_SETTINGS[`${ONBOARDING_FOLDER}/sales.report.yml`]
    expect(sales?.outputFormat).toBe('excel')
  })

  it('the modular example ships both the report and its imported component', () => {
    const paths = ONBOARDING_FILES.map((f) => f.path)
    expect(paths).toContain(`${ONBOARDING_FOLDER}/statement.report.yml`)
    expect(paths).toContain(`${ONBOARDING_FOLDER}/letterhead.component.yml`)
  })

  it('the auto-opened file is one of the created files', () => {
    expect(ONBOARDING_FILES.some((f) => f.path === ONBOARDING_OPEN_FIRST)).toBe(true)
  })

  it('each preset data source points at a file that gets created', () => {
    const paths = new Set(ONBOARDING_FILES.map((f) => f.path))
    for (const settings of Object.values(ONBOARDING_REPORT_SETTINGS)) {
      expect(paths.has(settings.dataSourcePath)).toBe(true)
    }
  })
})
