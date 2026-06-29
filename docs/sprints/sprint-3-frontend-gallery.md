# Sprint F3: Template Gallery & Organization

## 🎯 Objective
Create a template gallery system with organization, versioning, and template management.

## ✅ Tasks

### Frontend

#### 1. Template Gallery Sidebar
- [ ] List all templates in a tree
- [ ] Template groups (by type: Invoices, Reports, etc)
- [ ] Search/filter templates
- [ ] Favorites/starred templates
- [ ] Recent templates

#### 2. Template CRUD Operations
- [ ] New template button
- [ ] Rename template
- [ ] Duplicate template
- [ ] Delete template (with confirmation)
- [ ] Duplicate with new name

#### 3. Template Metadata
- [ ] Template name & description
- [ ] Created date, last modified
- [ ] Template size
- [ ] Output format (PDF, Excel, etc)
- [ ] Tags/categories

#### 4. Template Versioning
- [ ] Show version history
- [ ] Preview a previous version
- [ ] Restore to version
- [ ] Compare versions
- [ ] Version tags (Release, Draft, etc)

#### 5. Template Export/Import
- [ ] Export template + MockData + PageSettings as JSON
- [ ] Export as a .buelo file (or .blt)
- [ ] Import template file
- [ ] Template sharing via URL

### Backend

#### 1. Template Version Control
- [ ] Store version history
- [ ] GET /api/templates/{id}/versions
- [ ] GET /api/templates/{id}/versions/{versionId}
- [ ] POST /api/templates/{id}/restore/{versionId}

#### 2. Template Export/Import
- [ ] GET /api/templates/{id}/export - download as JSON
- [ ] POST /api/templates/import - upload template file
- [ ] Validate format on import

#### 3. Template Tagging
- [ ] Add tags/categories to TemplateRecord
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
- [ ] Gallery fully functional
- [ ] CRUD operations completed
- [ ] Versioning working
- [ ] Export/Import working

## 🚀 Next Sprint
Sprint F4: Workspace Integration & Export
