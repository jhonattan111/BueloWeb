export const BUELO_DECLARATIVE_REPORT_STARTER = `# Relatório declarativo Buelo — escrito em YAML, sem código C#.
# Edite e clique em Render. Para usar dados: escolha um Data source (.json)
# em Report Settings e referencie os campos com {{ data.campo }}.
kind: report
name: meu-relatorio
content:
  - text: { value: "Olá, Buelo declarativo!", style: { bold: true, size: 18 } }
  - text: { value: "Este relatório foi escrito em YAML, sem C#." }
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
