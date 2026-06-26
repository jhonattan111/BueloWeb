# TASKS.md — Buelo Frontend

## Overview
Source of truth for **frontend** sprint planning. Each sprint has its own file in `ai/sprints/`.

Backend sprints são rastreados separadamente em `Buelo.Api/ai/TASKS.md`.

> **Arquitetura atual**: Editor Monaco para C# templates; Report Settings Panel configurável; PDF preview nativo. A linguagem `.buelo` e seu suporte Monaco foram removidos. Consulte `ARCHITECTURE.md` na raiz para a visão completa.

## Sprint Index

### ✅ Sprints Arquivadas (DSL era — removida)

| Sprint | File | Goal | Status | Layer |
|--------|------|------|--------|-------|
| 1 | [sprint-1-base-layout.md](sprints/sprint-1-base-layout.md) | 3-column shell, Vue Router, placeholder panels | `[x] done` | Frontend |
| 2 | [sprint-2-monaco-editor.md](sprints/sprint-2-monaco-editor.md) | Monaco Editor for C# template + JSON data | `[x] done` | Frontend |
| 3 | [sprint-3-render-api.md](sprints/sprint-3-render-api.md) | POST /api/report/render, Pinia store, loading/error | `[x] done` | Frontend |
| 4 | [sprint-4-pdf-preview.md](sprints/sprint-4-pdf-preview.md) | iframe PDF preview, download button, blob URL lifecycle | `[x] done` | Frontend |
| 5 | [sprint-5-template-management.md](sprints/sprint-5-template-management.md) | CRUD templates in localStorage, sidebar list | `[x] done` | Frontend |
| 6 | [sprint-6-template-api.md](sprints/sprint-6-template-api.md) | Replace localStorage with backend REST API | `[x] done` | Frontend |
| 10 | _archived/sprint-10-frontend-buelo-language.md | Buelo DSL Monaco language: tokenizer, autocomplete, hover docs | `[x] archived` | Frontend |
| 11 | [sprint-11-frontend-artefact-manager.md](sprints/sprint-11-frontend-artefact-manager.md) | Artefact tabs UI, AddArtefactDialog, bundle export/import | `[x] done` | Frontend |
| 12 | [sprint-12-frontend-diagnostics-versioning.md](sprints/sprint-12-frontend-diagnostics-versioning.md) | Live diagnostics squiggles, version history panel, restore flow | `[x] done` | Frontend |
| 13 | [sprint-13-frontend-file-tree.md](sprints/sprint-13-frontend-file-tree.md) | VSCode-style file tree sidebar, global artefact browsing, NewFileDialog | `[x] done` | Frontend |
| 14 | _archived/sprint-14-frontend-buelo-dsl-language.md | .buelo YAML-like DSL: tokenizer, component-aware IntelliSense, snippets | `[x] archived` | Frontend |
| 15 | [sprint-15-frontend-project-file-editor.md](sprints/sprint-15-frontend-project-file-editor.md) | Visual project settings editor (page defaults, mock data, metadata) | `[x] done` | Frontend |
| 16 | [sprint-16-frontend-file-validation-ux.md](sprints/sprint-16-frontend-file-validation-ux.md) | Per-file validation UX: squiggles per extension, status bar, problems panel | `[x] done` | Frontend |
| 17 | [sprint-17-frontend-multi-format-export.md](sprints/sprint-17-frontend-multi-format-export.md) | Format selector (PDF/Excel), automatic download for non-PDF, format hints panel | `[x] done` | Frontend |
| 18 | [sprint-18-frontend-inline-project-config.md](sprints/sprint-18-frontend-inline-project-config.md) | Remove project route; sidebar settings panel; output format at creation | `[x] done` | Frontend |
| 19 | [sprint-19-frontend-project-validation.md](sprints/sprint-19-frontend-project-validation.md) | Project-wide validation UX; ProjectValidationPanel; tree badges | `[x] done` | Frontend |
| 20 | [sprint-20-frontend-remove-obsolete.md](sprints/sprint-20-frontend-remove-obsolete.md) | Remove Sections mode UI, ZIP bundle, hardcoded .cs virtual nodes, buelo-language | `[x] done` | Frontend |
| 21 | [sprint-21-frontend-bugfixes.md](sprints/sprint-21-frontend-bugfixes.md) | Fix Monaco autocomplete; fix refresh button GUID title bug | `[x] done` | Frontend |
| 22 | [sprint-22-frontend-workspace-vscode-ux.md](sprints/sprint-22-frontend-workspace-vscode-ux.md) | VS Code-like folder/file tree, multi-tabs, .json data source assignment, import UX | `[x] done` | Frontend |

### 🚀 Sprints Ativas (QuestPDF C# era)

| Sprint | File | Goal | Status | Layer |
|--------|------|------|--------|-------|
| F1 | [sprint-1-frontend-editor.md](sprints/sprint-1-frontend-editor.md) | Monaco Editor C#; validação em tempo real; PDF preview; template gallery | `[x] done` | Frontend |
| F2 | [sprint-2-frontend-settings.md](sprints/sprint-2-frontend-settings.md) | Report Settings Panel: page size, margins, colors, data source binding | `[x] done` | Frontend |
| F3 | [sprint-3-frontend-gallery.md](sprints/sprint-3-frontend-gallery.md) | Template Gallery: CRUD, versionamento, export/import, tags | `[x] done` | Frontend |
| F4 | [sprint-4-frontend-workspace.md](sprints/sprint-4-frontend-workspace.md) | Workspace integration, multi-format export, batch rendering | `[x] done` | Frontend |
| F5 | [sprint-23-frontend-typed-intellisense-settings.md](sprints/sprint-23-frontend-typed-intellisense-settings.md) | Monaco IntelliSense for data props; localStorage settings persistence; auto-apply | `[x] done` | Frontend |

## Dependency Chain

```
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4
                              ↘
             Sprint 5 ─────────→ Sprint 6
                                      ↓
                    [Backend sprints B1–B4 — see Buelo.Api/ai/TASKS.md]
                                      ↓
             Sprint 11 (Artefact Manager) ── Sprint 12 (Diagnostics + History)
                                      ↓
                    Sprint 13 (File Tree) ── [Sprint 14 archived — DSL]
                                      ↓
                              Sprint 15 (Project File Editor)
                                      ↓
                              Sprint 16 (File Validation UX)
                                      ↓
                              Sprint 17 (Multi-format Export)
                                      ↓
                     Sprint 18 (Inline settings + format at creation)
                                      ↓
                              Sprint 19 (Project-wide Validation)
                                      ↓
                              Sprint 20 (Remove Obsolete)
                                      ↓
                              Sprint 21 (Bug Fixes)
                                      ↓
                              Sprint 22 (Workspace VS Code UX)
                                      ↓
Sprint F1 (Editor C# + Preview) → Sprint F2 (Settings Panel)
    ↓
Sprint F3 (Template Gallery)
    ↓
Sprint F4 (Workspace Integration)
    ↓
Sprint F5 (Monaco IntelliSense + Settings Persistence)
```

## File Structure (reference)

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
    useTemplateDiagnostics.ts
  lib/
    utils.ts
  components/
    layout/
      AppLayout.vue
      SidebarTemplates.vue
    editors/
      CodeEditorPanel.vue
      ArtefactTabs.vue
    settings/
      ReportSettingsPanel.vue   ← F2: PageSettings UI
    preview/
      PdfPreviewPanel.vue
```

## Conventions

- Todos os templates são C# (`TemplateMode.FullClass`) — nenhum arquivo `.buelo` é exibido
- Monaco Editor usa modo `csharp` nativo do VS Code
- Report Settings mapeiam diretamente para `PageSettings` do backend
- Após cada sprint, validar contra backend com `dotnet run` + testes de integração manuais
