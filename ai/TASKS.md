# TASKS.md — Buelo Frontend

## Overview
Source of truth for **frontend** sprint planning. Each sprint has its own file in `ai/sprints/`.

Backend sprints (7–9) are tracked separately in `Buelo.Api/ai/TASKS.md`.

## Sprint Index

| Sprint | File | Goal | Status | Layer |
|--------|------|------|--------|-------|
| 1 | [sprint-1-base-layout.md](sprints/sprint-1-base-layout.md) | 3-column shell, Vue Router, placeholder panels | `[x] done` | Frontend |
| 2 | [sprint-2-monaco-editor.md](sprints/sprint-2-monaco-editor.md) | Monaco Editor for C# template + JSON data | `[x] done` | Frontend |
| 3 | [sprint-3-render-api.md](sprints/sprint-3-render-api.md) | POST /api/report/render, Pinia store, loading/error | `[x] done` | Frontend |
| 4 | [sprint-4-pdf-preview.md](sprints/sprint-4-pdf-preview.md) | iframe PDF preview, download button, blob URL lifecycle | `[x] done` | Frontend |
| 5 | [sprint-5-template-management.md](sprints/sprint-5-template-management.md) | CRUD templates in localStorage, sidebar list | `[x] done` | Frontend |
| 6 | [sprint-6-template-api.md](sprints/sprint-6-template-api.md) | Replace localStorage with backend REST API | `[x] done` | Frontend |
| 10 | [sprint-10-frontend-buelo-language.md](sprints/sprint-10-frontend-buelo-language.md) | Buelo DSL Monaco language: tokenizer, autocomplete, hover docs | `[x] done` | Frontend |
| 11 | [sprint-11-frontend-artefact-manager.md](sprints/sprint-11-frontend-artefact-manager.md) | Artefact tabs UI, AddArtefactDialog, bundle export/import | `[x] done` | Frontend |
| 12 | [sprint-12-frontend-diagnostics-versioning.md](sprints/sprint-12-frontend-diagnostics-versioning.md) | Live diagnostics squiggles, version history panel, restore flow | `[x] done` | Frontend |
| 13 | [sprint-13-frontend-file-tree.md](sprints/sprint-13-frontend-file-tree.md) | VSCode-style file tree sidebar, global artefact browsing, NewFileDialog | `[x] done` | Frontend |
| 14 | [sprint-14-frontend-buelo-dsl-language.md](sprints/sprint-14-frontend-buelo-dsl-language.md) | .buelo YAML-like DSL: new tokenizer, component-aware IntelliSense, snippets | `[x] done` | Frontend |
| 15 | [sprint-15-frontend-project-file-editor.md](sprints/sprint-15-frontend-project-file-editor.md) | Visual project settings editor (page defaults, mock data, metadata) | `[ ] pending` | Frontend |
| 16 | [sprint-16-frontend-file-validation-ux.md](sprints/sprint-16-frontend-file-validation-ux.md) | Per-file validation UX: squiggles per extension, status bar, problems panel | `[ ] pending` | Frontend |
| 17 | [sprint-17-frontend-multi-format-export.md](sprints/sprint-17-frontend-multi-format-export.md) | Format selector (PDF/Excel), automatic download for non-PDF, format hints panel | `[ ] pending` | Frontend |

## Dependency Chain
```
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4
                              ↘
             Sprint 5 ─────────→ Sprint 6
                                      ↓
                    [Backend sprints 7–9 — see Buelo.Api/ai/TASKS.md]
                                      ↓
                              Sprint 10 (Buelo Language)
                                      ↓
                              Sprint 11 (Artefact Manager)
                                      ↓
                              Sprint 12 (Diagnostics + History)
                                      ↓
                    [Backend sprints 13–17 — see Buelo.Api/ai/TASKS.md]
                                      ↓
                 Sprint 13 (File Tree) ──── Sprint 14 (.buelo DSL Language)
                                      ↓
                              Sprint 15 (Project File Editor)
                                      ↓
                              Sprint 16 (File Validation UX)
                                      ↓
                              Sprint 17 (Multi-format Export)
```

## Final File Structure (after all sprints)
```
src/
  router/
    index.ts
  types/
    template.ts              ← + TemplateArtefact, ValidateResult, TemplateVersionMeta
  services/
    reportService.ts         ← + renderById with optional version param
    templateService.ts       ← + artefact CRUD, validate, versions, export/import
  stores/
    reportStore.ts           ← + version param in render action
    templateStore.ts
  composables/
    useMonacoEditor.ts
    useActiveTemplate.ts     ← + artefact state, loadArtefacts, saveArtefact
    useTemplateDiagnostics.ts ← NEW: live squiggles via /validate
  lib/
    utils.ts
    buelo-language/           ← NEW: Monaco DSL registration
      index.ts
      tokenizer.ts
      completions.ts
      hover.ts
      snippets.ts
      spec.ts
  components/
    layout/
      AppLayout.vue
      SidebarTemplates.vue    ← + export/import bundle actions
    editors/
      CodeEditorPanel.vue
      TemplateEditor.vue      ← replaced by ArtefactTabs
      ArtefactTabs.vue        ← NEW: tabbed template + artefact editors
      AddArtefactDialog.vue   ← NEW: add new artefact
      VersionHistoryPanel.vue ← NEW: version history + restore
      JsonEditor.vue
    preview/
      PreviewPanel.vue
    ui/                       ← shadcn components (auto-generated)
  pages/
    ReportEditor/
      Index.vue
  assets/
    index.css
  main.ts                     ← + registerBueloLanguage() call
  App.vue
.env
vite.config.ts
```

## Agent Workflow
1. Pick the lowest-numbered `open` sprint
2. Check its dependency sprints are marked `done`
3. Read the sprint file fully before writing code
4. Implement only the tasks listed — no scope creep
5. Run `pnpm typecheck` after implementation
6. Mark sprint `done` in this table
