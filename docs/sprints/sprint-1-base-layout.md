# Sprint 1 — Base Layout

## Goal
Create the base shell of the Buelo application: a 3-column layout with named placeholder panels, Vue Router setup, and no business logic.

## Status
`[x] done`

## Dependencies
- shadcn-vue installed ✅
- Tailwind CSS installed ✅
- Vue Router must be installed (`pnpm add vue-router`)

## Tasks

### 1.1 Install Vue Router
```bash
pnpm add vue-router
```

### 1.2 Create router
File: `src/router/index.ts`
- History mode: `createWebHistory`
- Route `/` → lazy-load `pages/ReportEditor/Index.vue`

### 1.3 Create `AppLayout.vue`
File: `src/components/layout/AppLayout.vue`
- 3-column CSS Grid: `grid-cols-[260px_1fr_380px]`
- Height: `h-screen overflow-hidden`
- Dark-mode friendly background: `bg-background text-foreground`
- Slots: `#sidebar-left`, `#editor`, `#sidebar-right`
- On small screens collapse sidebars (min breakpoint: `lg`)

### 1.4 Create `SidebarTemplates.vue`
File: `src/components/layout/SidebarTemplates.vue`
- Uses shadcn `ScrollArea`
- Header with title "Templates" and a `+` `Button` (variant ghost, size icon)
- Placeholder list item with dummy text "No templates yet"
- Border right: `border-r border-border`

### 1.5 Create `CodeEditorPanel.vue`
File: `src/components/editors/CodeEditorPanel.vue`
- Placeholder `<div>` with text "Editor area"
- Full height: `h-full`
- Background: `bg-muted/30`

### 1.6 Create `PreviewPanel.vue`
File: `src/components/preview/PreviewPanel.vue`
- Placeholder `<div>` with text "PDF Preview"
- Full height: `h-full`
- Border left: `border-l border-border`
- Background: `bg-muted/20`

### 1.7 Wire everything in `pages/ReportEditor/Index.vue`
- Import and use `AppLayout`
- Fill slots with `SidebarTemplates`, `CodeEditorPanel`, `PreviewPanel`

### 1.8 Update `src/main.ts`
- Import router and register with `app.use(router)`

### 1.9 Update `src/App.vue`
- Replace content with `<RouterView />`

## File Structure After Sprint
```
src/
  router/
    index.ts
  components/
    layout/
      AppLayout.vue
      SidebarTemplates.vue
    editors/
      CodeEditorPanel.vue
    preview/
      PreviewPanel.vue
  pages/
    ReportEditor/
      Index.vue        ← updated
  main.ts              ← updated
  App.vue              ← updated
```

## Acceptance Criteria
- [ ] App renders without TypeScript errors (`pnpm typecheck`)
- [ ] 3-column layout visible at full screen
- [ ] Panels fill full height
- [ ] No business logic or API calls
