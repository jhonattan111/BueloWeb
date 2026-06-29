# Sprint F1: Report Editor & Template Management

## 🎯 Objective
Create a report editor interface with support for C# templates, real-time preview, and template management.

## ✅ Tasks

### Frontend

#### 1. Report Editor Layout
- [ ] 3-pane layout: Editor | Preview | Settings
- [ ] Resizable panels with drag dividers
- [ ] Monaco Editor with C# syntax highlighting
- [ ] Toolbar with actions: Save, Validate, Preview, Export

#### 2. Monaco Editor Setup
- [ ] Configure for the C# language
- [ ] Syntax highlighting for QuestPDF
- [ ] Basic IntelliSense (autocomplete)
- [ ] Go-to-definition (future)
- [ ] Theme selector (light/dark)

#### 3. Template Validation
- [ ] Real-time validation on keystroke
- [ ] Show errors in a problems panel
- [ ] Line number highlighting for errors
- [ ] Disable preview if template is invalid

#### 4. Live Preview
- [ ] Embed PDF viewer (pdfjs)
- [ ] Update preview when clicking "Preview"
- [ ] Show loading state
- [ ] Rendering error handling

#### 5. Template Gallery
- [ ] List existing templates
- [ ] New template from a template
- [ ] Rename/Delete
- [ ] Duplicate template
- [ ] Share template URL

### Backend

#### 1. Template API
- [ ] GET /api/templates - list all
- [ ] GET /api/templates/{id} - get one
- [ ] POST /api/templates - create
- [ ] PUT /api/templates/{id} - update
- [ ] DELETE /api/templates/{id} - delete

#### 2. Validation Endpoint
- [ ] POST /api/report/validate - already exists
- [ ] Return a list of errors

## 📋 Template Structure (Example)
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

## 🚀 Next Sprint
Sprint F2: Report Settings Panel (configuration UI)
