import { computed, ref, watch } from 'vue'
import { useActiveTemplate } from '@/composables/useActiveTemplate'
import { listJsonFiles } from '@/services/workspaceService'

export interface ReportSettingsState {
  pageSize: string
  orientation: string
  marginHorizontal?: number
  marginVertical?: number
  backgroundColor?: string
  defaultTextColor?: string
  defaultFontSize?: number
  showHeader: boolean
  showFooter: boolean
  watermarkText?: string
  dataSourcePath?: string
  outputFormat: 'pdf' | 'excel'
}

const DEFAULT_SETTINGS: ReportSettingsState = {
  pageSize: 'A4',
  orientation: 'Portrait',
  marginHorizontal: 2,
  marginVertical: 2,
  backgroundColor: '#FFFFFF',
  defaultTextColor: '#000000',
  defaultFontSize: 12,
  showHeader: true,
  showFooter: true,
  watermarkText: '',
  dataSourcePath: '',
  outputFormat: 'pdf',
}

// Per-file settings keyed by file path — persisted in sessionStorage for page reload resilience
const perFileSettings = ref<Map<string, ReportSettingsState>>(new Map())

const STORAGE_KEY = 'buelo.reportSettings'
try {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed: Record<string, ReportSettingsState> = JSON.parse(stored)
    perFileSettings.value = new Map(Object.entries(parsed))
  }
} catch {
  // ignore
}

function persistSettings(): void {
  try {
    const obj: Record<string, ReportSettingsState> = {}
    perFileSettings.value.forEach((v, k) => { obj[k] = v })
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch {
    // ignore
  }
}

const jsonFilesState = ref<string[]>([])
const settings = ref<ReportSettingsState>({ ...DEFAULT_SETTINGS })
const saveError = ref<string | null>(null)
const isSaving = ref(false)

// ── Legacy helpers kept for backward compatibility ────────────────────────────

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  return undefined
}

/** @deprecated — kept for FilePropertiesPanel; @project blocks are no longer written */
export function parseProjectBlock(source: string): Partial<ReportSettingsState> {
  const match = source.match(/@project\s*\n((?:[ \t]+.+\n?)*)/)
  if (!match) return {}

  const kv = Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.trim().match(/^([\w-]+):\s*(.+)$/i))
      .filter(Boolean)
      .map((entry) => [entry![1].toLowerCase(), entry![2].replace(/^"|"$/g, '')]),
  )

  const output = String(kv['outputformat'] ?? 'pdf').toLowerCase() === 'excel' ? 'excel' : 'pdf'

  return {
    pageSize: kv['pagesize'],
    orientation: kv['orientation'],
    marginHorizontal: kv['marginhorizontal'] ? Number(kv['marginhorizontal']) : undefined,
    marginVertical: kv['marginvertical'] ? Number(kv['marginvertical']) : undefined,
    backgroundColor: kv['backgroundcolor'],
    defaultTextColor: kv['defaulttextcolor'],
    defaultFontSize: kv['defaultfontsize'] ? Number(kv['defaultfontsize']) : undefined,
    showHeader: parseBoolean(kv['showheader']),
    showFooter: parseBoolean(kv['showfooter']),
    watermarkText: kv['watermarktext'],
    dataSourcePath: kv['datasourcepath'] ?? '',
    outputFormat: output,
  }
}

export function useReportSettings() {
  const { activeFile } = useActiveTemplate()

  const canEdit = computed(() => Boolean(activeFile.value?.path?.toLowerCase().endsWith('.cs')))
  const activePath = computed(() => (canEdit.value ? activeFile.value?.path ?? '' : ''))

  const invalidDataSource = computed(() => {
    const selected = settings.value.dataSourcePath?.trim()
    if (!selected) return false
    return !jsonFilesState.value.includes(selected)
  })

  // Load settings from per-file store when active file changes
  watch(
    activePath,
    (path) => {
      if (!path) {
        settings.value = { ...DEFAULT_SETTINGS }
        return
      }
      const stored = perFileSettings.value.get(path)
      if (stored) {
        settings.value = { ...stored }
      } else {
        settings.value = { ...DEFAULT_SETTINGS }
      }
    },
    { immediate: true },
  )

  async function refreshJsonFiles(): Promise<void> {
    jsonFilesState.value = await listJsonFiles()
  }

  /** Saves current settings for the active file (in-memory + sessionStorage). */
  async function apply(): Promise<void> {
    if (!canEdit.value || !activePath.value) return
    isSaving.value = true
    saveError.value = null
    try {
      perFileSettings.value = new Map(perFileSettings.value)
      perFileSettings.value.set(activePath.value, { ...settings.value })
      persistSettings()
    } finally {
      isSaving.value = false
    }
  }

  return {
    settings,
    jsonFiles: computed(() => jsonFilesState.value),
    canEdit,
    invalidDataSource,
    isSaving,
    saveError,
    refreshJsonFiles,
    apply,
  }
}
