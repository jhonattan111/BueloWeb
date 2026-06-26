# Sprint F1: Report Editor & Template Management

## 🎯 Objetivo
Criar interface de editor de relatórios com suporte a C# templates, preview em tempo real, e gerenciamento de templates.

## ✅ Tarefas

### Frontend

#### 1. Report Editor Layout
- [ ] 3-pane layout: Editor | Preview | Settings
- [ ] Resizable panels com drag dividers
- [ ] Monaco Editor com C# syntax highlighting
- [ ] Toolbar com ações: Save, Validate, Preview, Export

#### 2. Monaco Editor Setup
- [ ] Configurar para linguagem C#
- [ ] Syntax highlighting para QuestPDF
- [ ] IntelliSense básico (autocomplete)
- [ ] Go-to-definition (futuro)
- [ ] Theme selector (light/dark)

#### 3. Template Validation
- [ ] Real-time validation on keystroke
- [ ] Mostrar erros em problema panel
- [ ] Line number highlighting para erros
- [ ] Disable preview se template inválido

#### 4. Live Preview
- [ ] Embed PDF viewer (pdfjs)
- [ ] Atualizar preview ao clicar "Preview"
- [ ] Mostrar loading state
- [ ] Tratamento de erros de rendering

#### 5. Template Gallery
- [ ] Listar templates existentes
- [ ] Nova template com template
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
- [ ] POST /api/report/validate - já existe
- [ ] Retornar lista de erros

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

## 🚀 Próximo Sprint
Sprint F2: Report Settings Panel (configuration UI)
