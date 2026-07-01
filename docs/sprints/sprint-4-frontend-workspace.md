# Sprint F4 (Frontend) — Workspace Integration & Export

## Goal
Integrate the report system with the workspace (file tree), allow exporting finished reports to
PDF/Excel, and organize files.

## Status
`[x] done`

## Dependencies
- Sprint F3 (Template Gallery & Organization) — complete

## Scope

**Frontend — Workspace File Tree:**
- [x] Expand the file tree to show Templates
- [x] Create a Templates folder if it doesn't exist
- [x] Drag templates between folders
- [x] Right-click context menu (new, rename, delete)
- [x] Different template icons by type

**Frontend — Export Functionality:**
- [x] Export as PDF button
- [x] Export as Excel button
- [x] Export with current settings
- [x] Batch export (multiple templates)
- [x] Download to local machine

**Frontend — Render Results Preview:**
- [x] Show the rendered report in a viewer
- [x] Download button for the result
- [x] Print button (via browser)
- [x] Copy to clipboard (for sharing)

**Frontend — Recent Exports:**
- [x] History of exported reports
- [x] Re-export with the same data/settings
- [x] Archive exports (local storage)

**Backend — Workspace Integration:**
- [x] GET /api/workspace/templates - list workspace templates
- [x] POST /api/workspace/templates - create a template in the workspace
- [x] PUT /api/workspace/templates/{path} - update on the filesystem

**Backend — Batch Rendering:**
- [x] POST /api/report/batch-render - render multiple templates
- [x] Return an array of PDFs/Excels; progress reporting for long-running operations

**Backend — Export Endpoint:**
- [x] GET /api/report/export - export the final result
- [x] Correct Content-Disposition headers
- [x] Filename with timestamp

## Notes

Complete workflow reference:
```
1. User creates a new template
2. Edits it in Monaco Editor
3. Configures Settings (PageSize, Margins, etc)
4. Configures Data Source (Global Artefact)
5. Preview in PDF viewer
6. Click "Export as PDF"
7. File downloaded with the correct name
8. Template saved in the workspace
```

Final architecture reference:
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

This sprint completed the original project roadmap: create reports in pure C#, configure layout
via UI, use JSON data as a source, export to PDF/Excel, manage template versioning, and integrate
with the workspace. (Note: the product later moved away from this "pure C#" direction toward the
declarative YAML era — see [`../sprint-history.md`](../sprint-history.md) and
[`../../CLAUDE.md`](../../CLAUDE.md) for current state.)

Future roadmap ideas noted at the time (not committed sprints): performance (caching, async
rendering), advanced features (scheduled reports, email triggers), analytics (template usage
stats), collaboration (template sharing, comments), extensibility (custom plugins, helpers).
