# CLAUDE.md — BueloWeb

Guide for AI agents (Claude Code) in this repository. It is the **canonical document** of the frontend; in case of divergence with docs in `docs/`, this file wins.

## What it is

`BueloWeb` is the **frontend** of the Buelo product: a report editor in the **workspace (VS Code-like)** style. The user writes **C#** templates (QuestPDF `IDocument` classes) in a Monaco editor, configures page/data, and previews the **PDF/Excel** rendered by the API.

> Consumes the [`BueloApi`](../BueloApi) API at `http://localhost:5238`. Umbrella repo: [`Buelo`](..) (submodules).

## Stack

- **Vue 3.5** — Composition API, **always** `<script setup lang="ts">`
- **TypeScript** + **Vite 6**
- **Pinia 3** (state) · **Vue Router 5** (one route: `/`)
- **Monaco Editor** via `vite-plugin-monaco-editor` (patched): `csharp` mode (templates) **and** `yaml` (declarative definitions, via `monaco-yaml` + API JSON Schemas)
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **shadcn-vue** / **reka-ui** (`components/ui/`)
- `@vueuse/core`, `lucide-vue-next`
- Package manager: **pnpm** (workspace) · alias `@` → `src`

## Commands

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # vue-tsc -b && vite build
pnpm preview
pnpm typecheck    # vue-tsc --noEmit
```

**After any change, run `pnpm typecheck` (zero errors) before finishing.** For the app to work, `BueloApi` must be running on `:5238` (`dotnet run --project ../BueloApi/Buelo.Api`).

**Commit & push:** with `pnpm typecheck` + `pnpm build` green, do `git commit` and `git push` (don't accumulate local work); then bump the pointer in the umbrella repo and push there too. If any check fails, fix it before committing/pushing. See [`../CLAUDE.md`](../CLAUDE.md) (§Commit & push policy).

## Configuration

`.env`:
```
VITE_API_BASE_URL=http://localhost:5238
```
Every service reads `import.meta.env.VITE_API_BASE_URL`. The API enables CORS only for `http://localhost:5173`.

## Structure (`src/`)

```
pages/ReportEditor/Index.vue   ← single screen: 3-panel shell (tree · editor · preview)
router/index.ts                ← route '/' → ReportEditor
services/                      ← fetch against the API (no axios)
  reportService.ts             ← render, renderById, renderWorkspaceFile, getSupportedFormats
  templateService.ts           ← template CRUD
  validateService.ts           ← file/project validation
  workspaceService.ts          ← file tree, content, types
stores/                        ← Pinia: reportStore, templateStore
composables/                   ← useActiveTemplate, useMonacoEditor, useOpenEditors,
                                 useFileValidation, useProjectValidation, useReportSettings,
                                 useTemplateDiagnostics, useWorkspaceTree
lib/
  buelo-language/              ← Monaco C# IntelliSense (NOT the old DSL)
    index.ts                   ← registerBueloLanguage() — BUELO_LANGUAGE_ID = 'csharp'
    csharpDataCompletions.ts   ← autocomplete for the data props
    csharpTypeInjector.ts      ← injects C# types inferred from the JSON
    snippets.ts
  utils.ts                     ← cn() (clsx + tailwind-merge)
types/                         ← template.ts, workspace.ts, globalArtefact.ts
components/
  layout/    AppLayout, FileTreePanel/Node/ContextMenu, ProjectSettingsPanel,
             SidebarTemplates, FilePropertiesPanel
  editors/   CodeEditorPanel, TemplateEditor, JsonEditor, ArtefactTabs, AddArtefactDialog,
             NewFileDialog, EditorStatusBar, ValidationSummaryPanel, ProjectValidationPanel,
             VersionHistoryPanel
  preview/   PreviewPanel  (PDF iframe / download)
  ui/        shadcn-vue primitives (button, dialog, tabs, input, alert, scroll-area, ...)
```

## Conventions

- **Composition API + `<script setup lang="ts">`** in every component. Type props/emits.
- UI components come from shadcn-vue in `components/ui/` (config in `components.json`); reuse before creating new ones.
- Shared state → Pinia store; reusable logic → composable in `composables/` (`MaybeRefOrGetter` input when it makes sense).
- HTTP calls only via `services/` (`fetch`, no axios). API errors are read by `readApiError`.
- Monaco: `csharp` mode (templates) and `yaml` (declarative definitions). The `lib/buelo-language/` folder is the **types/autocomplete layer**, not a custom language — the `.buelo` DSL was removed, don't reintroduce it.
- **Declarative YAML:** `lib/buelo-language/yamlSchemaSetup.ts` configures `monaco-yaml` with the JSON Schemas served by the API (`GET api/schemas/{kind}`, in `services/schemaService.ts`), associated by the `*.<kind>.yml` name convention (e.g., `invoice.report.yml`). `yaml` worker registered in `vite.config.ts` (`customWorkers`).
- **Packages:** `vite`/`@vitejs/plugin-vue` pinned to major 6/5 — vite 7/8 break the patched `vite-plugin-monaco-editor@1.1.0`. `lucide-vue-next` is deprecated (migrate to `@lucide/vue`).
- Imports use the `@/...` alias.

## Product mental model

Templates = C# `IDocument` classes (compiled by the API with Roslyn). The frontend edits the code + data (JSON), validates (per-file squiggles), and renders PDF/Excel via `api/report/*`. API detail: see [`../BueloApi/CLAUDE.md`](../BueloApi/CLAUDE.md).

## History

`docs/` keeps the index and sprint history (`.buelo` DSL era → C#/QuestPDF era) — reference, not current state.
