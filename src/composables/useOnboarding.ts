import { ref } from 'vue'
import { createFile, createFolder } from '@/services/workspaceService'
import { presetFileSettings } from '@/composables/useReportSettings'
import {
  ONBOARDING_FILES,
  ONBOARDING_FOLDERS,
  ONBOARDING_OPEN_FIRST,
  ONBOARDING_REPORT_SETTINGS,
} from '@/lib/onboardingExamples'

const STORAGE_KEY = 'buelo.onboarded'

/**
 * First-run onboarding: offers to create the example showcase (declarative + C# reports
 * with data and a helper script) so a new user has something that renders immediately.
 */
export function useOnboarding() {
  const showWelcome = ref(false)
  const isCreating = ref(false)
  const error = ref<string | null>(null)

  function hasOnboarded(): boolean {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY))
    } catch {
      return true
    }
  }

  function markSeen(): void {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  /** Show the welcome modal on first run only. */
  function maybeShow(): void {
    if (!hasOnboarded()) showWelcome.value = true
  }

  function dismiss(): void {
    markSeen()
    showWelcome.value = false
  }

  /**
   * Creates the example folder + files and pre-sets each report's data source so
   * "open + Render" works immediately. Returns the path to open first (or null on error).
   */
  async function createExamples(): Promise<string | null> {
    isCreating.value = true
    error.value = null
    try {
      // Create the showcase folders (root first, then each report's subfolder).
      for (const folder of ONBOARDING_FOLDERS) {
        try {
          await createFolder(folder)
        } catch {
          // folder may already exist — fine
        }
      }
      for (const file of ONBOARDING_FILES) {
        await createFile(file.path, file.content, true)
      }
      for (const [reportPath, reportSettings] of Object.entries(ONBOARDING_REPORT_SETTINGS)) {
        presetFileSettings(reportPath, reportSettings)
      }
      markSeen()
      showWelcome.value = false
      return ONBOARDING_OPEN_FIRST
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create the examples.'
      return null
    } finally {
      isCreating.value = false
    }
  }

  return { showWelcome, isCreating, error, maybeShow, dismiss, createExamples }
}
