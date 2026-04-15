# TASKS.md — Buelo Frontend

## Overview
This file is the source of truth for sprint planning. Each sprint has its own file in `ai/sprints/`.

## Sprint Index

| Sprint | File | Goal | Status |
|--------|------|------|--------|
| 1 | [sprint-1-base-layout.md](sprints/sprint-1-base-layout.md) | 3-column shell, Vue Router, placeholder panels | `[x] done` |
| 2 | [sprint-2-monaco-editor.md](sprints/sprint-2-monaco-editor.md) | Monaco Editor for C# template + JSON data | `[x] done` |
| 3 | [sprint-3-render-api.md](sprints/sprint-3-render-api.md) | POST /api/report/render, Pinia store, loading/error | `[x] done` |
| 4 | [sprint-4-pdf-preview.md](sprints/sprint-4-pdf-preview.md) | iframe PDF preview, download button, blob URL lifecycle | `[x] done` |
| 5 | [sprint-5-template-management.md](sprints/sprint-5-template-management.md) | CRUD templates in localStorage, sidebar list | `[x] done` |
| 6 | [sprint-6-template-api.md](sprints/sprint-6-template-api.md) | Replace localStorage with backend REST API | `[x] done` |

## Dependency Chain
```
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4
                              ↘
             Sprint 5 ─────────→ Sprint 6
```

## Final File Structure (after all sprints)
```
src/
  router/
    index.ts
  types/
    template.ts
  services/
    reportService.ts
    templateService.ts
  stores/
    reportStore.ts
    templateStore.ts
  composables/
    useMonacoEditor.ts
    useActiveTemplate.ts
  components/
    layout/
      AppLayout.vue
      SidebarTemplates.vue
    editors/
      CodeEditorPanel.vue
      TemplateEditor.vue
      JsonEditor.vue
    preview/
      PreviewPanel.vue
    ui/                      ← shadcn components (auto-generated)
  pages/
    ReportEditor/
      Index.vue
  assets/
    index.css
  main.ts
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
