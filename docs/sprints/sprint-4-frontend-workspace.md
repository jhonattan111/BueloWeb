# Sprint F4: Workspace Integration & Export

## 🎯 Objective
Integrate the report system with the workspace (file tree), allow exporting finished reports to PDF/Excel, and organize files.

## ✅ Tasks

### Frontend

#### 1. Workspace File Tree
- [ ] Expand the file tree to show Templates
- [ ] Create a Templates folder if it doesn't exist
- [ ] Drag templates between folders
- [ ] Right-click context menu (new, rename, delete)
- [ ] Different template icons by type

#### 2. Export Functionality
- [ ] Export as PDF button
- [ ] Export as Excel button
- [ ] Export with current settings
- [ ] Batch export (multiple templates)
- [ ] Download to local machine

#### 3. Render Results Preview
- [ ] Show the rendered report in a viewer
- [ ] Download button for the result
- [ ] Print button (via browser)
- [ ] Copy to clipboard (for sharing)

#### 4. Recent Exports
- [ ] History of exported reports
- [ ] Re-export with the same data/settings
- [ ] Archive exports (local storage)

### Backend

#### 1. Workspace Integration
- [ ] GET /api/workspace/templates - list workspace templates
- [ ] POST /api/workspace/templates - create a template in the workspace
- [ ] PUT /api/workspace/templates/{path} - update on the filesystem

#### 2. Batch Rendering
- [ ] POST /api/report/batch-render - render multiple templates
- [ ] Return an array of PDFs/Excels; progress reporting for long-running operations

#### 3. Export Endpoint
- [ ] GET /api/report/export - export the final result
- [ ] Correct Content-Disposition headers
- [ ] Filename with timestamp

## 🔄 Complete Workflow
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
- [ ] Workspace file tree shows templates
- [ ] Export PDF/Excel working
- [ ] Batch operations supported
- [ ] Complete workflow functional
- [ ] Template persistence

## 🎉 Project Completion
After this sprint, Buelo will be ready to:
- ✅ Create reports in pure C#
- ✅ Configure layout via UI
- ✅ Use JSON data as a source
- ✅ Export to PDF/Excel
- ✅ Manage template versioning
- ✅ Integrate with the workspace

## 📋 Future Roadmap
- Performance: Caching, async rendering
- Advanced: Scheduled reports, email triggers
- Analytics: Template usage stats
- Collaboration: Template sharing, comments
- Extensibility: Custom plugins, helpers
