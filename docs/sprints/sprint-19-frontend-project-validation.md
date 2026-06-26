# Sprint 19 (Frontend) — Project-wide Validation UX

## Goal
Replace the per-file "Validate" button with a **"Validate Project"** action that validates all
workspace files at once and shows an aggregated result. Per-file inline squiggles (Monaco) remain
unchanged; this sprint only changes the manual trigger and the results panel.

## Status
`[x] done`

## Dependencies
- Sprint 19 backend complete ✅ (`POST /api/validate/project` available)
- Sprint 16 frontend complete ✅ (`ValidationSummaryPanel`, `useFileValidation`)

---

## Tasks

### FE-19.1 — Add `validateProject()` to `validateService.ts`

File: `src/services/validateService.ts`

```ts
export interface ProjectValidationResult {
  valid: boolean
  totalErrors: number
  totalWarnings: number
  files: FileValidationEntry[]
}

export interface FileValidationEntry {
  path: string
  extension: string
  result: FileValidationResult
}

export async function validateProject(): Promise<ProjectValidationResult> {
  const response = await fetch(`${BASE_URL}/api/validate/project`, {
    method: 'POST',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Server error: ${response.status}`)
  }

  return response.json() as Promise<ProjectValidationResult>
}
```

---

### FE-19.2 — `useProjectValidation` composable

File: `src/composables/useProjectValidation.ts` (new file)

```ts
import { ref } from 'vue'
import { validateProject } from '@/services/validateService'
import type { ProjectValidationResult } from '@/services/validateService'
import { useWorkspaceTree } from '@/composables/useWorkspaceTree'
import type { FileValidationResult } from '@/types/template'

const isValidating = ref(false)
const result = ref<ProjectValidationResult | null>(null)
const error = ref<string | null>(null)
const panelOpen = ref(false)

export function useProjectValidation() {
  const { setValidationResult } = useWorkspaceTree()

  async function runValidation(): Promise<void> {
    isValidating.value = true
    error.value = null
    panelOpen.value = true
    try {
      result.value = await validateProject()
      // Sync per-file badge state into the workspace tree
      for (const entry of result.value.files) {
        // Derive node id from path — use the last path segment to match tree node ids
        const nodeId = entry.path
        setValidationResult(nodeId, entry.result)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Validation failed'
    } finally {
      isValidating.value = false
    }
  }

  return { isValidating, result, error, panelOpen, runValidation }
}
```

---

### FE-19.3 — Replace per-file "Validate" button in `ArtefactTabs.vue`

File: `src/components/editors/ArtefactTabs.vue`

Replace the existing "Validate" button (which validates only the current file) with a
**"Validate Project"** button that triggers `useProjectValidation().runValidation()`.

The diagnostic state indicator (`✓`, `✕`, `⟳`, `-`) at the top of the tab bar should now reflect
the **project-level** valid/invalid state (`result.value?.valid`), not just the current file.

```html
<!-- Before -->
<Button @click="validate">Validate</Button>

<!-- After -->
<Button :disabled="isValidating" @click="runValidation">
  <span v-if="isValidating">Validating…</span>
  <span v-else>Validate Project</span>
</Button>
```

Remove the old `useFileValidation` call that was used to validate just the active file on-demand
(keep per-keystroke Monaco squiggles intact — those go through `useTemplateDiagnostics`).

---

### FE-19.4 — `ProjectValidationPanel.vue`

File: `src/components/editors/ProjectValidationPanel.vue` (new file)

A slide-up/overlay panel (or a bottom panel) that shows the full project validation result.

**Layout:**

```
┌─ Validation Results ────────────────────────── [×] close ─┐
│  ✓ 5 files  ·  2 errors  ·  0 warnings                     │
│                                                             │
│  ✕  relatorio_1/relatorio_1.buelo              2 errors    │
│     · line 12: Unknown component 'chrt'                    │
│     · line 18: Missing required field 'columns'            │
│                                                             │
│  ✓  data/colaboradores.json                    0 errors    │
│  ✓  helpers/formatters.csx                     0 errors    │
└─────────────────────────────────────────────────────────────┘
```

Props:
```ts
const props = defineProps<{
  result: ProjectValidationResult | null
  isValidating: boolean
  error: string | null
  open: boolean
}>()

const emit = defineEmits<{ close: [] }>()
```

Behaviour:
- While `isValidating` is true: show a spinner with "Validating workspace…".
- On error: show an error alert.
- On result: render the file list. Files with errors expand by default; clean files are collapsed.
- Clicking a file entry activates that file in the editor (emit `openFile` or call
  `useWorkspaceTree().selectNode` with the matching tree node).

---

### FE-19.5 — Wire `ProjectValidationPanel` into `ReportEditor/Index.vue`

File: `src/pages/ReportEditor/Index.vue`

```html
<ProjectValidationPanel
  :result="validation.result.value"
  :is-validating="validation.isValidating.value"
  :error="validation.error.value"
  :open="validation.panelOpen.value"
  @close="validation.panelOpen.value = false"
  @open-file="onOpenFile"
/>
```

Pass `useProjectValidation()` into `ArtefactTabs` via provide/inject or props.

---

### FE-19.6 — File tree badge alignment

File: `src/components/layout/FileTreeNode.vue`

The per-node validation badges already read from `useWorkspaceTree().validationState`. After
project validation, `setValidationResult` is called for each file in the result — update the badge
key to match the file path format returned by the backend (e.g. `"relatorio_1/relatorio_1.buelo"`).

The current badge key is the node `id`. Ensure that after project validation, the node ids in the
tree match the paths returned by `/api/validate/project`. If necessary, add a `path` field to
`FileNode` to disambiguate id (GUID) from path (relative file path).

---

## UX Flow Summary

1. User clicks **"Validate Project"** → spinner shows.
2. Backend validates all files, returns aggregated result.
3. `ProjectValidationPanel` slides up with the full report.
4. File tree nodes get ✓/✕ badges.
5. User clicks a file entry in the panel → editor navigates to that file.
