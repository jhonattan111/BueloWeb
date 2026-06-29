# CLAUDE.md — BueloWeb

Guia para agentes de IA (Claude Code) neste repositório. É o **documento canônico** do front; em caso de divergência com docs em `docs/`, este arquivo vence.

## O que é

`BueloWeb` é o **frontend** do produto Buelo: um editor de relatórios estilo **workspace (VS Code-like)**. O usuário escreve templates **C#** (classes `IDocument` do QuestPDF) num editor Monaco, configura página/dados e pré-visualiza o **PDF/Excel** renderizado pela API.

> Consome a API [`BueloApi`](../BueloApi) em `http://localhost:5238`. Repo guarda-chuva: [`Buelo`](..) (submodules).

## Stack

- **Vue 3.5** — Composition API, **sempre** `<script setup lang="ts">`
- **TypeScript** + **Vite 6**
- **Pinia 3** (estado) · **Vue Router 5** (uma rota: `/`)
- **Monaco Editor** via `vite-plugin-monaco-editor` (patched): modo `csharp` (templates) **e** `yaml` (definições declarativas, via `monaco-yaml` + JSON Schemas da API)
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **shadcn-vue** / **reka-ui** (`components/ui/`)
- `@vueuse/core`, `lucide-vue-next`
- Gerenciador: **pnpm** (workspace) · alias `@` → `src`

## Comandos

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # vue-tsc -b && vite build
pnpm preview
pnpm typecheck    # vue-tsc --noEmit
```

**Após qualquer mudança, rode `pnpm typecheck` (zero erros) antes de concluir.** Para o app funcionar, a `BueloApi` precisa estar rodando em `:5238` (`dotnet run --project ../BueloApi/Buelo.Api`).

## Configuração

`.env`:
```
VITE_API_BASE_URL=http://localhost:5238
```
Todo service lê `import.meta.env.VITE_API_BASE_URL`. A API libera CORS só para `http://localhost:5173`.

## Estrutura (`src/`)

```
pages/ReportEditor/Index.vue   ← única tela: shell de 3 painéis (árvore · editor · preview)
router/index.ts                ← rota '/' → ReportEditor
services/                      ← fetch contra a API (sem axios)
  reportService.ts             ← render, renderById, renderWorkspaceFile, getSupportedFormats
  templateService.ts           ← CRUD de templates
  validateService.ts           ← validação de arquivo/projeto
  workspaceService.ts          ← árvore de arquivos, conteúdo, tipos
stores/                        ← Pinia: reportStore, templateStore
composables/                   ← useActiveTemplate, useMonacoEditor, useOpenEditors,
                                 useFileValidation, useProjectValidation, useReportSettings,
                                 useTemplateDiagnostics, useWorkspaceTree
lib/
  buelo-language/              ← IntelliSense C# do Monaco (NÃO é a DSL antiga)
    index.ts                   ← registerBueloLanguage() — BUELO_LANGUAGE_ID = 'csharp'
    csharpDataCompletions.ts   ← autocomplete das props do data
    csharpTypeInjector.ts      ← injeta tipos C# inferidos do JSON
    snippets.ts
  utils.ts                     ← cn() (clsx + tailwind-merge)
types/                         ← template.ts, workspace.ts, globalArtefact.ts
components/
  layout/    AppLayout, FileTreePanel/Node/ContextMenu, ProjectSettingsPanel,
             SidebarTemplates, FilePropertiesPanel
  editors/   CodeEditorPanel, TemplateEditor, JsonEditor, ArtefactTabs, AddArtefactDialog,
             NewFileDialog, EditorStatusBar, ValidationSummaryPanel, ProjectValidationPanel,
             VersionHistoryPanel
  preview/   PreviewPanel  (iframe de PDF / download)
  ui/        primitivos shadcn-vue (button, dialog, tabs, input, alert, scroll-area, ...)
```

## Convenções

- **Composition API + `<script setup lang="ts">`** em todo componente. Tipar props/emits.
- Componentes de UI vêm do shadcn-vue em `components/ui/` (config em `components.json`); reuse antes de criar novos.
- Estado compartilhado → store Pinia; lógica reutilizável → composable em `composables/` (input `MaybeRefOrGetter` quando fizer sentido).
- Chamadas HTTP só via `services/` (`fetch`, sem axios). Erros da API são lidos por `readApiError`.
- Monaco: modo `csharp` (templates) e `yaml` (definições declarativas). A pasta `lib/buelo-language/` é a **camada de tipos/autocomplete**, não uma linguagem custom — a DSL `.buelo` foi removida, não reintroduza.
- **YAML declarativo:** `lib/buelo-language/yamlSchemaSetup.ts` configura o `monaco-yaml` com os JSON Schemas servidos pela API (`GET api/schemas/{kind}`, em `services/schemaService.ts`), associados por convenção de nome `*.<kind>.yml` (ex.: `fatura.report.yml`). Worker `yaml` registrado em `vite.config.ts` (`customWorkers`).
- **Pacotes:** `vite`/`@vitejs/plugin-vue` presos no major 6/5 — vite 7/8 quebram o `vite-plugin-monaco-editor@1.1.0` patchado. `lucide-vue-next` está deprecado (migrar p/ `@lucide/vue`).
- Imports usam o alias `@/...`.

## Modelo mental do produto

Templates = classes C# `IDocument` (compiladas pela API com Roslyn). O front edita o código + dados (JSON), valida (squiggles por arquivo), e renderiza PDF/Excel via `api/report/*`. Detalhe da API: ver [`../BueloApi/CLAUDE.md`](../BueloApi/CLAUDE.md).

## Histórico

`docs/` guarda o índice e histórico de sprints (era DSL `.buelo` → era C#/QuestPDF) — referência, não estado atual.
