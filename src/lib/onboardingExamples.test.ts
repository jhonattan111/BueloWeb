import {
  ONBOARDING_FILES,
  ONBOARDING_FOLDER,
  ONBOARDING_FOLDERS,
  ONBOARDING_OPEN_FIRST,
  ONBOARDING_REPORT_SETTINGS,
} from '@/lib/onboardingExamples'

const dirname = (path: string): string => path.split('/').slice(0, -1).join('/')

describe('onboardingExamples', () => {
  it('every showcase file has a path and non-empty content', () => {
    expect(ONBOARDING_FILES.length).toBeGreaterThan(0)
    for (const file of ONBOARDING_FILES) {
      expect(file.path).toBeTruthy()
      expect(file.content.length).toBeGreaterThan(0)
    }
  })

  it('the Excel example report is preset to excel output', () => {
    const sales = ONBOARDING_REPORT_SETTINGS[`${ONBOARDING_FOLDER}/sales/sales.report.yml`]
    expect(sales?.outputFormat).toBe('excel')
  })

  it('the modular example ships both the report and its imported component (colocated)', () => {
    const paths = ONBOARDING_FILES.map((f) => f.path)
    expect(paths).toContain(`${ONBOARDING_FOLDER}/statement/statement.report.yml`)
    expect(paths).toContain(`${ONBOARDING_FOLDER}/statement/letterhead.component.yml`)
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

  it('every showcase file lives in a per-report subfolder (examples/<name>/<file>)', () => {
    for (const file of ONBOARDING_FILES) {
      const segments = file.path.split('/')
      expect(segments.length).toBe(3)
      expect(segments[0]).toBe(ONBOARDING_FOLDER)
    }
  })

  it('each report has its own folder — no two reports share a subfolder', () => {
    const reportFolders = ONBOARDING_FILES.filter((f) => f.path.endsWith('.report.yml')).map((f) =>
      dirname(f.path),
    )
    expect(new Set(reportFolders).size).toBe(reportFolders.length)
  })

  it('each preset data source is colocated with its report', () => {
    for (const [reportPath, settings] of Object.entries(ONBOARDING_REPORT_SETTINGS)) {
      expect(dirname(settings.dataSourcePath)).toBe(dirname(reportPath))
    }
  })

  it('ONBOARDING_FOLDERS covers every file folder, parents first', () => {
    // Root comes before its children, and every file's folder is present.
    expect(ONBOARDING_FOLDERS[0]).toBe(ONBOARDING_FOLDER)
    const folders = new Set(ONBOARDING_FOLDERS)
    for (const file of ONBOARDING_FILES) {
      expect(folders.has(dirname(file.path))).toBe(true)
    }
    const depths = ONBOARDING_FOLDERS.map((f) => f.split('/').length)
    const sorted = [...depths].sort((a, b) => a - b)
    expect(depths).toEqual(sorted)
  })
})
