# Sprint F3: Template Gallery & Organization

## 🎯 Objetivo
Criar um sistema de galeria de templates com organização, versionamento, e gerenciamento de templates.

## ✅ Tarefas

### Frontend

#### 1. Template Gallery Sidebar
- [ ] Listar todos os templates em árvore
- [ ] Grupos de templates (por tipo: Invoices, Reports, etc)
- [ ] Search/filter templates
- [ ] Favorites/starred templates
- [ ] Recent templates

#### 2. Template CRUD Operations
- [ ] New template button
- [ ] Rename template
- [ ] Duplicate template
- [ ] Delete template (com confirmação)
- [ ] Duplicate with new name

#### 3. Template Metadata
- [ ] Template name & description
- [ ] Created date, last modified
- [ ] Template size
- [ ] Output format (PDF, Excel, etc)
- [ ] Tags/categories

#### 4. Template Versioning
- [ ] Mostrar histórico de versões
- [ ] Preview de versão anterior
- [ ] Restore to version
- [ ] Compare versions
- [ ] Version tags (Release, Draft, etc)

#### 5. Template Export/Import
- [ ] Export template + MockData + PageSettings como JSON
- [ ] Export como arquivo .buelo (or .blt)
- [ ] Import template file
- [ ] Template sharing via URL

### Backend

#### 1. Template Version Control
- [ ] Guardar histórico de versões
- [ ] GET /api/templates/{id}/versions
- [ ] GET /api/templates/{id}/versions/{versionId}
- [ ] POST /api/templates/{id}/restore/{versionId}

#### 2. Template Export/Import
- [ ] GET /api/templates/{id}/export - download as JSON
- [ ] POST /api/templates/import - upload template file
- [ ] Validar formato na importação

#### 3. Template Tagging
- [ ] Adicionar tags/categories em TemplateRecord
- [ ] GET /api/templates?tag=sales
- [ ] GET /api/templates/categories

## 🗂️ Template Organization
```
My Templates/
├── Invoices/
│   ├── Simple Invoice
│   ├── Detailed Invoice
│   └── Invoice with Terms
├── Reports/
│   ├── Sales Report
│   ├── Financial Dashboard
│   └── Operations Snapshot
├── Certificates/
└── Drafts/
```

## 📦 Export Format
```json
{
  "id": "guid",
  "name": "Invoice Template",
  "description": "Professional invoice",
  "template": "using QuestPDF...",
  "pageSettings": { ... },
  "mockData": { ... },
  "version": "1.0.0"
}
```

## ✅ Sprint Completion
- [ ] Gallery totalmente funcional
- [ ] CRUD operations completadas
- [ ] Versionamento funcionando
- [ ] Export/Import working

## 🚀 Próximo Sprint
Sprint F4: Workspace Integration & Export
