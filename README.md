# BueloWeb

Vue 3 frontend for editing and rendering Buelo projects in the workspace style.

## Stack

- Vue 3 + TypeScript
- Vite
- Pinia
- Vue Router
- Monaco Editor
- Tailwind CSS v4

## Configuration

`.env` file:

```env
VITE_API_BASE_URL=http://localhost:5238
```

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm typecheck
```

## Main features

- File tree (`api/workspace/*`)
- Editing of `.buelo`, `.json`, and auxiliary files
- Multiple editor tabs
- Rendering by active file
- File and project validation
- Output format selection (PDF/Excel)

## Backend integration

Services in `src/services` consume:

- `reportService.ts`
- `workspaceService.ts`
- `templateService.ts`
- `validateService.ts`

## Full local development

1. Start the API (`dotnet run --project ../Buelo.Api`).
2. Run `pnpm dev` in this directory.
3. Open `http://localhost:5173`.
