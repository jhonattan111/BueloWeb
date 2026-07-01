# Sprint F3 (Frontend) — Template Gallery & Organization

## Goal
Create a template gallery system with organization, versioning, and template management.

## Status
`[x] done`

## Dependencies
- Sprint F2 (Report Settings Panel) — complete

## Scope

**Frontend — Template Gallery Sidebar:**
- [x] List all templates in a tree
- [x] Template groups (by type: Invoices, Reports, etc)
- [x] Search/filter templates
- [x] Favorites/starred templates
- [x] Recent templates

**Frontend — Template CRUD Operations:**
- [x] New template button
- [x] Rename template
- [x] Duplicate template
- [x] Delete template (with confirmation)
- [x] Duplicate with new name

**Frontend — Template Metadata:**
- [x] Template name & description
- [x] Created date, last modified
- [x] Template size
- [x] Output format (PDF, Excel, etc)
- [x] Tags/categories

**Frontend — Template Versioning:**
- [x] Show version history
- [x] Preview a previous version
- [x] Restore to version
- [x] Compare versions
- [x] Version tags (Release, Draft, etc)

**Frontend — Template Export/Import:**
- [x] Export template + MockData + PageSettings as JSON
- [x] Export as a .buelo file (or .blt)
- [x] Import template file
- [x] Template sharing via URL

**Backend — Template Version Control:**
- [x] Store version history
- [x] GET /api/templates/{id}/versions
- [x] GET /api/templates/{id}/versions/{versionId}
- [x] POST /api/templates/{id}/restore/{versionId}

**Backend — Template Export/Import:**
- [x] GET /api/templates/{id}/export - download as JSON
- [x] POST /api/templates/import - upload template file
- [x] Validate format on import

**Backend — Template Tagging:**
- [x] Add tags/categories to TemplateRecord
- [x] GET /api/templates?tag=sales
- [x] GET /api/templates/categories

## Notes

Template organization reference:
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

Export format reference:
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

Next sprint: Sprint F4 — Workspace Integration & Export.
