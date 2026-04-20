# BueloWeb

Frontend Vue 3 para edição e renderização de projetos Buelo no estilo workspace.

## Stack

- Vue 3 + TypeScript
- Vite
- Pinia
- Vue Router
- Monaco Editor
- Tailwind CSS v4

## Configuração

Arquivo `.env`:

```env
VITE_API_BASE_URL=http://localhost:5238
```

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm typecheck
```

## Funcionalidades principais

- Árvore de arquivos (`api/workspace/*`)
- Edição de `.buelo`, `.json` e arquivos auxiliares
- Abas múltiplas de editor
- Renderização por arquivo ativo
- Validação de arquivo e de projeto
- Seleção de formato de saída (PDF/Excel)

## Integração com backend

Serviços em `src/services` consomem:

- `reportService.ts`
- `workspaceService.ts`
- `templateService.ts`
- `validateService.ts`

## Desenvolvimento local completo

1. Suba a API (`dotnet run --project ../Buelo.Api`).
2. Rode `pnpm dev` neste diretório.
3. Acesse `http://localhost:5173`.
