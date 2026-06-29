export const BUELO_DECLARATIVE_REPORT_STARTER = `# Buelo declarative report — written in YAML, no C# code.
# Edit and click Render. To use data: pick a Data source (.json) in Report
# Settings and reference fields with {{ data.field }}.
kind: report
name: my-report
content:
  - text: { value: "Hello, declarative Buelo!", style: { bold: true, size: 18 } }
  - text: { value: "This report was written in YAML, no C#." }
`

export const BUELO_STARTER_TEMPLATE = `using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class MyReport : IDocument
{
    private readonly dynamic _data;

    public MyReport(dynamic data) => _data = data;

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);
            page.Header().Text("My Report").Bold().FontSize(20);
            page.Content().Column(col =>
            {
                col.Item().Text($"Hello {_data.name}");
            });
            page.Footer().AlignCenter().Text(x =>
            {
                x.CurrentPageNumber();
                x.Span(" / ");
                x.TotalPages();
            });
        });
    }
}
`
