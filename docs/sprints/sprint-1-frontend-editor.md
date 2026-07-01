# Sprint F1 (Frontend) — Report Editor & Template Management

## Goal
Create a report editor interface with support for C# templates, real-time preview, and template management.

## Status
`[x] done`

## Dependencies
- None

## Scope

**Report Editor Layout:**
- [x] 3-pane layout: Editor | Preview | Settings
- [x] Resizable panels with drag dividers
- [x] Monaco Editor with C# syntax highlighting
- [x] Toolbar with actions: Save, Validate, Preview, Export

**Monaco Editor Setup:**
- [x] Configure for the C# language
- [x] Syntax highlighting for QuestPDF
- [x] Basic IntelliSense (autocomplete)
- [ ] Go-to-definition (future)
- [x] Theme selector (light/dark)

**Template Validation:**
- [x] Real-time validation on keystroke
- [x] Show errors in a problems panel
- [x] Line number highlighting for errors
- [x] Disable preview if template is invalid

**Live Preview:**
- [x] Embed PDF viewer (pdfjs)
- [x] Update preview when clicking "Preview"
- [x] Show loading state
- [x] Rendering error handling

**Template Gallery:**
- [x] List existing templates
- [x] New template from a template
- [x] Rename/Delete
- [x] Duplicate template
- [x] Share template URL

**Backend — Template API:**
- [x] GET /api/templates - list all
- [x] GET /api/templates/{id} - get one
- [x] POST /api/templates - create
- [x] PUT /api/templates/{id} - update
- [x] DELETE /api/templates/{id} - delete

**Backend — Validation Endpoint:**
- [x] POST /api/report/validate - already exists
- [x] Return a list of errors

## Notes

Template structure example used as the reference shape for authored templates:

```csharp
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

public class SalesReportDocument : IDocument
{
    private readonly dynamic _data;

    public SalesReportDocument(dynamic data) => _data = data;

    public DocumentMetadata GetMetadata() => new()
    {
        Title = $"Sales Report - {_data.Month}"
    };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            
            page.Header().Text("Sales Report").FontSize(24).Bold();
            page.Content().Column(col =>
            {
                // Render your content here
            });
            page.Footer().Text("Page " + page.PageNumber);
        });
    }
}
```

Next sprint at the time: Sprint F2 (Report Settings Panel — configuration UI).
