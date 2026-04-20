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

const jsonFilesState = ref<string[]>([])
const settings = ref<ReportSettingsState>({ ...DEFAULT_SETTINGS })
const saveError = ref<string | null>(null)
const isSaving = ref(false)

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  return undefined
}

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

export function upsertProjectBlock(source: string, block: string): string {
  const pattern = /^@project\s*\r?\n(?:[ \t]+.*(?:\r?\n|$))*/
  if (pattern.test(source)) {
    return source.replace(pattern, `${block}\n`)
  }
  return source.trim().length > 0 ? `${block}\n\n${source}` : `${block}\n`
}

export function readOutputFormatFromBueloSource(source: string): 'pdf' | 'excel' {
  const parsed = parseProjectBlock(source)
  return parsed.outputFormat === 'excel' ? 'excel' : 'pdf'
}

function serializeProjectBlock(state: ReportSettingsState): string {
  const lines = ['@project']
  lines.push(`  pageSize: ${state.pageSize}`)
  lines.push(`  orientation: ${state.orientation}`)

  if (state.marginHorizontal != null) lines.push(`  marginHorizontal: ${state.marginHorizontal}`)
  if (state.marginVertical != null) lines.push(`  marginVertical: ${state.marginVertical}`)
  if (state.backgroundColor) lines.push(`  backgroundColor: "${state.backgroundColor}"`)
  if (state.defaultTextColor) lines.push(`  defaultTextColor: "${state.defaultTextColor}"`)
  if (state.defaultFontSize != null) lines.push(`  defaultFontSize: ${state.defaultFontSize}`)

  lines.push(`  showHeader: ${state.showHeader}`)
  lines.push(`  showFooter: ${state.showFooter}`)

  if (state.watermarkText) lines.push(`  watermarkText: "${state.watermarkText}"`)
  if (state.dataSourcePath) lines.push(`  dataSourcePath: "${state.dataSourcePath}"`)
  lines.push(`  outputFormat: ${state.outputFormat}`)

  return lines.join('\n')
}

export function useReportSettings() {
  const { activeFile, saveFile } = useActiveTemplate()

  const canEdit = computed(() => Boolean(activeFile.value?.path?.toLowerCase().endsWith('.buelo')))
  const activeBueloPath = computed(() => (canEdit.value ? activeFile.value?.path ?? '' : ''))
  const activeSource = computed(() => (canEdit.value ? activeFile.value?.content ?? '' : ''))

  const invalidDataSource = computed(() => {
    const selected = settings.value.dataSourcePath?.trim()
    if (!selected) return false
    return !jsonFilesState.value.includes(selected)
  })

  watch(
    activeSource,
    (source) => {
      if (!source) {
        settings.value = { ...DEFAULT_SETTINGS }
        return
      }
      settings.value = {
        ...DEFAULT_SETTINGS,
        ...parseProjectBlock(source),
      }
    },
    { immediate: true },
  )

  async function refreshJsonFiles(): Promise<void> {
    jsonFilesState.value = await listJsonFiles()
  }

  async function apply(): Promise<void> {
    if (!canEdit.value || !activeBueloPath.value) return
    isSaving.value = true
    saveError.value = null

    try {
      const nextSource = upsertProjectBlock(activeSource.value, serializeProjectBlock(settings.value))
      await saveFile({
        path: activeBueloPath.value,
        content: nextSource,
      })
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Failed to save settings.'
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
