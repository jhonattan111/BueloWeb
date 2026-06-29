// First-run showcase: example reports that render out of the box, covering the product's
// features (declarative YAML engine + the C#/QuestPDF escape hatch).
// The content below was verified rendering against the API (render-declarative / render).

export interface OnboardingFile {
  /** Workspace path, e.g. `examples/invoice.report.yml`. */
  path: string
  content: string
}

const INVOICE_REPORT = `# Invoice report - header, items table with aggregated total, currency/tax-id formatting.
# In Report Settings, pick "examples/invoice.data.json" as the Data source, then click Render.
kind: report
name: invoice
meta:
  page: { size: A4, margin: "2cm" }
header:
  - row:
      items:
        - column:
            content:
              - text: { value: "Buelo Accounting", style: { bold: true, size: 16, color: "#1D9E75" } }
              - text: { value: "Tax ID 11.222.333/0001-44", style: { size: 9, color: "#666666" } }
        - column:
            content:
              - text: { value: "INVOICE #{{ data.number }}", style: { bold: true, size: 16, align: right } }
              - text: { value: "Issued: {{ today }}", style: { size: 9, color: "#666666", align: right } }
  - divider: { color: "#1D9E75", thickness: 2 }
content:
  - spacer: 8
  - text:
      value: "Client: {{ data.client.name }}  -  Tax ID {{ data.client.taxId | cnpj }}"
      style: { size: 11 }
  - spacer: 10
  - table:
      data: data.items
      rowStyle: { paddingY: 5, borderBottom: "1px #DDDDDD" }
      columns:
        - { width: 24px, header: "#",       cell: "{{ index + 1 }}" }
        - { width: 4*,   header: "Product", cell: "{{ item.name }}" }
        - { width: 1*,   header: "Unit",    cell: "{{ currency(item.price) }}", align: right }
        - { width: 1*,   header: "Qty",     cell: "{{ item.qty }}", align: right }
        - { width: 2*,   header: "Total",   cell: "{{ currency(item.price * item.qty) }}", align: right }
      footer:
        - { span: 4, text: "Invoice total", style: { bold: true, align: right } }
        - { text: "{{ currency(sum(data.items, 'price * qty')) }}", style: { bold: true, align: right } }
footer:
  - text: { value: "Page {{ page }} of {{ pageCount }}", style: { align: center, size: 9, color: "#999999" } }
`

const INVOICE_DATA = `{
  "number": 1042,
  "client": { "name": "Acme Trading Co.", "taxId": "12345678000190" },
  "items": [
    { "name": "Monthly accounting service", "price": 350.0, "qty": 4 },
    { "name": "Tax filing", "price": 80.0, "qty": 12 },
    { "name": "Management report", "price": 220.5, "qty": 2 }
  ]
}
`

const EMPLOYEES_REPORT = `# Employees report - grouped by department with a per-group subtotal (groupBy + sum).
# In Report Settings, pick "examples/employees.data.json" as the Data source, then click Render.
kind: report
name: employees
meta:
  page: { size: A4, margin: "2cm" }
header:
  - text: { value: "Employee List", style: { bold: true, size: 18, color: "#222222" } }
  - divider: { color: "#DDDDDD", thickness: 1 }
content:
  - spacer: 8
  - table:
      data: data.employees
      groupBy: department
      rowStyle: { paddingY: 4, borderBottom: "1px #EEEEEE" }
      group:
        header: { text: "{{ group.key }}", style: { bold: true, background: "#EEEEEE", size: 12 } }
        footer: { text: "Subtotal {{ group.key }}: {{ currency(sum(group.items, 'salary')) }}", style: { align: right, bold: true } }
      columns:
        - { width: 3*, header: "Name",   cell: "{{ item.name }}" }
        - { width: 2*, header: "Role",   cell: "{{ item.role }}" }
        - { width: 1*, header: "Salary", cell: "{{ currency(item.salary) }}", align: right }
`

const EMPLOYEES_DATA = `{
  "employees": [
    { "name": "Ana Souza",    "role": "Analyst",     "department": "Accounting", "salary": 4200 },
    { "name": "Bruno Lima",   "role": "Assistant",   "department": "Accounting", "salary": 3100 },
    { "name": "Carla Dias",   "role": "Manager",     "department": "Tax",        "salary": 7800 },
    { "name": "Diego Alves",  "role": "Analyst",     "department": "Tax",        "salary": 4500 },
    { "name": "Eva Martins",  "role": "Coordinator", "department": "HR",         "salary": 6200 }
  ]
}
`

const DASHBOARD_REPORT = `# Dashboard report - card/panel KPI tiles in a row, plus markdown and a divider.
# In Report Settings, pick "examples/dashboard.data.json" as the Data source, then click Render.
kind: report
name: dashboard
meta:
  page: { size: A4, margin: "1.5cm" }
header:
  - text: { value: "Monthly Dashboard", style: { bold: true, size: 18, color: "#222222" } }
  - text: { value: "Period: {{ data.period }}", style: { size: 10, color: "#666666" } }
  - divider: { color: "#DDDDDD", thickness: 1 }
content:
  - spacer: 8
  - row:
      spacing: 8
      items:
        - card:
            style: { background: "#F1F5F9", padding: 10, border: "1px #E2E8F0" }
            content:
              - text: { value: "Revenue", style: { size: 9, color: "#64748B" } }
              - text: { value: "{{ currency(data.revenue) }}", style: { bold: true, size: 16, color: "#1D9E75" } }
        - card:
            style: { background: "#F1F5F9", padding: 10, border: "1px #E2E8F0" }
            content:
              - text: { value: "Expenses", style: { size: 9, color: "#64748B" } }
              - text: { value: "{{ currency(data.expenses) }}", style: { bold: true, size: 16, color: "#D85A30" } }
        - card:
            style: { background: "#F1F5F9", padding: 10, border: "1px #E2E8F0" }
            content:
              - text: { value: "Profit", style: { size: 9, color: "#64748B" } }
              - text: { value: "{{ currency(data.revenue - data.expenses) }}", style: { bold: true, size: 16 } }
  - spacer: 12
  - card:
      style: { padding: 12, border: "1px #E2E8F0" }
      content:
        - text: { value: "Notes", style: { bold: true, size: 12 } }
        - markdown: |
            This report showcases **cards** (KPI tiles), a **row** layout, **markdown**
            and a **divider** - all declared in YAML, rendered with QuestPDF.
`

const DASHBOARD_DATA = `{
  "period": "March 2026",
  "revenue": 48200.0,
  "expenses": 31750.0
}
`

const LETTER_CS = `// C# report (QuestPDF) - the full-power "escape hatch" of Buelo.
// In Report Settings, pick "examples/letter.data.json" as the Data source, then click Render.
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class Letter : IDocument
{
    private readonly dynamic _data;

    public Letter(dynamic data) => _data = data;

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container) =>
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);

            page.Header().Text("Buelo Accounting").Bold().FontSize(16);

            page.Content().PaddingVertical(20).Column(col =>
            {
                col.Spacing(10);
                col.Item().Text($"To: {_data.recipient}");
                col.Item().Text($"Subject: {_data.subject}").Bold();
                col.Item().Text((string)_data.body);
                col.Item().PaddingTop(20).Text("Best regards,");
                col.Item().Text("The Buelo Team").Bold();
            });

            page.Footer().AlignCenter().Text(x =>
            {
                x.CurrentPageNumber();
                x.Span(" / ");
                x.TotalPages();
            });
        });
}
`

const LETTER_DATA = `{
  "recipient": "Acme Trading Co.",
  "subject": "Monthly accounting close",
  "body": "Please find attached the management report for the period. Let us know if you have any questions."
}
`

const HELPERS_CSX = `// Helper script (.csx) - reusable C# functions for templates.
// Example complementary file (helpers shared across C# reports).

static string Greeting(string name) => $"Hello, {name}!";

static string Initial(string name) =>
    string.IsNullOrWhiteSpace(name) ? "?" : name.Trim()[..1].ToUpperInvariant();
`

/** Folder where the examples are created. */
export const ONBOARDING_FOLDER = 'examples'

/** All showcase files (reports + data + script). */
export const ONBOARDING_FILES: OnboardingFile[] = [
  { path: `${ONBOARDING_FOLDER}/invoice.report.yml`, content: INVOICE_REPORT },
  { path: `${ONBOARDING_FOLDER}/invoice.data.json`, content: INVOICE_DATA },
  { path: `${ONBOARDING_FOLDER}/employees.report.yml`, content: EMPLOYEES_REPORT },
  { path: `${ONBOARDING_FOLDER}/employees.data.json`, content: EMPLOYEES_DATA },
  { path: `${ONBOARDING_FOLDER}/dashboard.report.yml`, content: DASHBOARD_REPORT },
  { path: `${ONBOARDING_FOLDER}/dashboard.data.json`, content: DASHBOARD_DATA },
  { path: `${ONBOARDING_FOLDER}/letter.cs`, content: LETTER_CS },
  { path: `${ONBOARDING_FOLDER}/letter.data.json`, content: LETTER_DATA },
  { path: `${ONBOARDING_FOLDER}/helpers.csx`, content: HELPERS_CSX },
]

/**
 * Data source pre-configured per report, so that "open + Render" works immediately
 * without the user having to pick the JSON by hand.
 */
export const ONBOARDING_REPORT_DATA_SOURCE: Record<string, string> = {
  [`${ONBOARDING_FOLDER}/invoice.report.yml`]: `${ONBOARDING_FOLDER}/invoice.data.json`,
  [`${ONBOARDING_FOLDER}/employees.report.yml`]: `${ONBOARDING_FOLDER}/employees.data.json`,
  [`${ONBOARDING_FOLDER}/dashboard.report.yml`]: `${ONBOARDING_FOLDER}/dashboard.data.json`,
  [`${ONBOARDING_FOLDER}/letter.cs`]: `${ONBOARDING_FOLDER}/letter.data.json`,
}

/** Report opened automatically after creating the examples. */
export const ONBOARDING_OPEN_FIRST = `${ONBOARDING_FOLDER}/invoice.report.yml`
