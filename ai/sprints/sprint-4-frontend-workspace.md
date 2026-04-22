# Sprint F4: Workspace Integration & Export

## 🎯 Objetivo
Integrar o sistema de relatórios com workspace (file tree), permitir exportação de relatórios finalizados para PDF/Excel, e organização de arquivos.

## ✅ Tarefas

### Frontend

#### 1. Workspace File Tree
- [ ] Expandir file tree para mostrar Templates
- [ ] Criar pasta Templates se não existir
- [ ] Arrastar templates entre pastas
- [ ] Right-click context menu (new, rename, delete)
- [ ] Template icons diferentes por tipo

#### 2. Export Functionality
- [ ] Export as PDF button
- [ ] Export as Excel button
- [ ] Export with current settings
- [ ] Batch export (múltiplos templates)
- [ ] Download to local machine

#### 3. Render Results Preview
- [ ] Mostrar relatório renderizado em viewer
- [ ] Download button para resultado
- [ ] Print button (via browser)
- [ ] Copy to clipboard (para sharing)

#### 4. Recent Exports
- [ ] Histórico de relatórios exportados
- [ ] Re-export com mesmos dados/settings
- [ ] Archive exports (local storage)

### Backend

#### 1. Workspace Integration
- [ ] GET /api/workspace/templates - listar templates do workspace
- [ ] POST /api/workspace/templates - criar template no workspace
- [ ] PUT /api/workspace/templates/{path} - atualizar no filesystem

#### 2. Batch Rendering
- [ ] POST /api/report/batch-render - render múltiplos templates
- [ ] Return array de PDFs/ExcelsMeeting de progresso para operações longas

#### 3. Export Endpoint
- [ ] GET /api/report/export - exportar resultado final
- [ ] Content-Disposition headers corretos
- [ ] Filename com timestamp

## 🔄 Complete Workflow
```
1. User cria novo template
2. Edita em Monaco Editor
3. Configura Settings (PageSize, Margins, etc)
4. Configura Data Source (Global Artefact)
5. Preview em PDF viewer
6. Click "Export as PDF"
7. File downloaded com nome correto
8. Template salvo no workspace
```

## 📊 Final Architecture
```
BueloWeb/
├── Report Editor (Monaco C#)
├── Report Settings Panel
├── PDF Preview (pdfjs)
├── Template Gallery
└── Workspace Tree

Buelo.Api/
├── /api/report/validate
├── /api/report/render
├── /api/report/export
├── /api/templates (CRUD)
├── /api/artefacts (Global Data)
└── /api/workspace/* (File ops)

Buelo.Engine/
├── TemplateEngine (C# compilation)
├── PageSettings (config)
└── Output Renderers (PDF, Excel)
```

## ✅ Sprint Completion
- [ ] Workspace file tree mostra templates
- [ ] Export PDF/Excel funcionando
- [ ] Batch operations suportadas
- [ ] Workflow completo funcional
- [ ] Persistência de templates

## 🎉 Project Completion
Após este sprint, Buelo estará pronto para:
- ✅ Criar relatórios em C# puro
- ✅ Configurar layout via UI
- ✅ Usar dados JSON como fonte
- ✅ Exportar para PDF/Excel
- ✅ Gerenciar templates versioning
- ✅ Integração com workspace

## 📋 Roadmap Futuro
- Performance: Caching, async rendering
- Advanced: Scheduled reports, email triggers
- Analytics: Template usage stats
- Collaboration: Template sharing, comments
- Extensibility: Custom plugins, helpers
