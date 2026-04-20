import { computed, ref } from 'vue'

const openPathsState = ref<string[]>([])
const activePathState = ref('')
const dirtyMapState = ref<Record<string, boolean>>({})

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').trim()
}

export function useOpenEditors() {
  const openPaths = computed(() => openPathsState.value)
  const activePath = computed({
    get: () => activePathState.value,
    set: (value: string) => {
      activePathState.value = normalizePath(value)
    },
  })

  function open(path: string): void {
    const normalized = normalizePath(path)
    if (!openPathsState.value.includes(normalized)) {
      openPathsState.value = [...openPathsState.value, normalized]
    }
    activePathState.value = normalized
  }

  function switchTo(path: string): void {
    const normalized = normalizePath(path)
    if (!openPathsState.value.includes(normalized)) return
    activePathState.value = normalized
  }

  function close(path: string): void {
    const normalized = normalizePath(path)
    const index = openPathsState.value.indexOf(normalized)
    if (index === -1) return

    const nextPaths = [...openPathsState.value]
    nextPaths.splice(index, 1)
    openPathsState.value = nextPaths

    if (activePathState.value === normalized) {
      const nextIndex = Math.max(0, index - 1)
      activePathState.value = nextPaths[nextIndex] ?? ''
    }

    const nextDirty = { ...dirtyMapState.value }
    delete nextDirty[normalized]
    dirtyMapState.value = nextDirty
  }

  function markDirty(path: string, dirty: boolean): void {
    const normalized = normalizePath(path)
    dirtyMapState.value = { ...dirtyMapState.value, [normalized]: dirty }
  }

  function isDirty(path: string): boolean {
    return Boolean(dirtyMapState.value[normalizePath(path)])
  }

  function clearAll(): void {
    openPathsState.value = []
    activePathState.value = ''
    dirtyMapState.value = {}
  }

  return {
    openPaths,
    activePath,
    dirtyMap: computed(() => dirtyMapState.value),
    open,
    switchTo,
    close,
    markDirty,
    isDirty,
    clearAll,
  }
}
