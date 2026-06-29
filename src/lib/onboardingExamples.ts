// Showcase de primeiro acesso: relatórios de exemplo que renderizam de cara, cobrindo
// as funcionalidades do produto (engine declarativo YAML + escape-hatch em C#/QuestPDF).
// O conteúdo abaixo foi verificado renderizando contra a API (render-declarative / render).

export interface OnboardingFile {
  /** Caminho no workspace, ex. `exemplos/fatura.report.yml`. */
  path: string
  content: string
}

const FATURA_REPORT = `# Fatura declarativa — cabeçalho, tabela com total agregado, formatação de moeda/CNPJ.
# Em Report Settings, escolha "exemplos/fatura.data.json" como Data source e clique Render.
kind: report
name: fatura
meta:
  page: { size: A4, margin: "2cm" }
header:
  - row:
      items:
        - column:
            content:
              - text: { value: "Buelo Contabilidade", style: { bold: true, size: 16, color: "#1D9E75" } }
              - text: { value: "CNPJ 11.222.333/0001-44", style: { size: 9, color: "#666666" } }
        - column:
            content:
              - text: { value: "FATURA #{{ data.numero }}", style: { bold: true, size: 16, align: right } }
              - text: { value: "Emissao: {{ today }}", style: { size: 9, color: "#666666", align: right } }
  - divider: { color: "#1D9E75", thickness: 2 }
content:
  - spacer: 8
  - text:
      value: "Cliente: {{ data.cliente.nome }}  -  CNPJ {{ data.cliente.cnpj | cnpj }}"
      style: { size: 11 }
  - spacer: 10
  - table:
      data: data.itens
      rowStyle: { paddingY: 5, borderBottom: "1px #DDDDDD" }
      columns:
        - { width: 24px, header: "#",        cell: "{{ index + 1 }}" }
        - { width: 4*,   header: "Produto",  cell: "{{ item.nome }}" }
        - { width: 1*,   header: "Unitario", cell: "{{ moeda(item.preco) }}", align: right }
        - { width: 1*,   header: "Qtd",      cell: "{{ item.qtd }}", align: right }
        - { width: 2*,   header: "Total",    cell: "{{ moeda(item.preco * item.qtd) }}", align: right }
      footer:
        - { span: 4, text: "Total da fatura", style: { bold: true, align: right } }
        - { text: "{{ moeda(sum(data.itens, 'preco * qtd')) }}", style: { bold: true, align: right } }
footer:
  - text: { value: "Pagina {{ page }} de {{ pageCount }}", style: { align: center, size: 9, color: "#999999" } }
`

const FATURA_DATA = `{
  "numero": 1042,
  "cliente": { "nome": "Acme Comercio Ltda", "cnpj": "12345678000190" },
  "itens": [
    { "nome": "Consultoria contabil mensal", "preco": 350.0, "qtd": 4 },
    { "nome": "Emissao de guias", "preco": 80.0, "qtd": 12 },
    { "nome": "Relatorio gerencial", "preco": 220.5, "qtd": 2 }
  ]
}
`

const COLABORADORES_REPORT = `# Relacao de colaboradores agrupada por departamento, com subtotal por grupo (groupBy + sum).
# Em Report Settings, escolha "exemplos/colaboradores.data.json" como Data source e clique Render.
kind: report
name: colaboradores
meta:
  page: { size: A4, margin: "2cm" }
header:
  - text: { value: "Relacao de Colaboradores", style: { bold: true, size: 18, color: "#222222" } }
  - divider: { color: "#DDDDDD", thickness: 1 }
content:
  - spacer: 8
  - table:
      data: data.colaboradores
      groupBy: departamento
      rowStyle: { paddingY: 4, borderBottom: "1px #EEEEEE" }
      group:
        header: { text: "{{ group.key }}", style: { bold: true, background: "#EEEEEE", size: 12 } }
        footer: { text: "Subtotal {{ group.key }}: {{ moeda(sum(group.items, 'salario')) }}", style: { align: right, bold: true } }
      columns:
        - { width: 3*, header: "Nome",    cell: "{{ item.nome }}" }
        - { width: 2*, header: "Cargo",   cell: "{{ item.cargo }}" }
        - { width: 1*, header: "Salario", cell: "{{ moeda(item.salario) }}", align: right }
`

const COLABORADORES_DATA = `{
  "colaboradores": [
    { "nome": "Ana Souza",    "cargo": "Analista",     "departamento": "Contabil", "salario": 4200 },
    { "nome": "Bruno Lima",   "cargo": "Assistente",   "departamento": "Contabil", "salario": 3100 },
    { "nome": "Carla Dias",   "cargo": "Gerente",      "departamento": "Fiscal",   "salario": 7800 },
    { "nome": "Diego Alves",  "cargo": "Analista",     "departamento": "Fiscal",   "salario": 4500 },
    { "nome": "Eva Martins",  "cargo": "Coordenadora", "departamento": "RH",       "salario": 6200 }
  ]
}
`

const CARTA_CS = `// Relatorio via C# (QuestPDF) — o "escape hatch" de poder total do Buelo.
// Em Report Settings, escolha "exemplos/carta.data.json" como Data source e clique Render.
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class Carta : IDocument
{
    private readonly dynamic _data;

    public Carta(dynamic data) => _data = data;

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container) =>
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);

            page.Header().Text("Buelo Contabilidade").Bold().FontSize(16);

            page.Content().PaddingVertical(20).Column(col =>
            {
                col.Spacing(10);
                col.Item().Text($"Para: {_data.destinatario}");
                col.Item().Text($"Assunto: {_data.assunto}").Bold();
                col.Item().Text((string)_data.corpo);
                col.Item().PaddingTop(20).Text("Atenciosamente,");
                col.Item().Text("Equipe Buelo").Bold();
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

const CARTA_DATA = `{
  "destinatario": "Acme Comercio Ltda",
  "assunto": "Fechamento contabil do mes",
  "corpo": "Segue em anexo o relatorio gerencial do periodo. Qualquer duvida, estamos a disposicao."
}
`

const HELPERS_CSX = `// Script auxiliar (.csx) — funcoes C# reutilizaveis para templates.
// Arquivo complementar de exemplo (helpers compartilhados entre relatorios C#).

static string Saudacao(string nome) => $"Ola, {nome}!";

static string Moeda(decimal valor) => valor.ToString("C", new System.Globalization.CultureInfo("pt-BR"));

static string Inicial(string nome) =>
    string.IsNullOrWhiteSpace(nome) ? "?" : nome.Trim()[..1].ToUpperInvariant();
`

/** Pasta onde os exemplos são criados. */
export const ONBOARDING_FOLDER = 'exemplos'

/** Todos os arquivos do showcase (relatórios + dados + script). */
export const ONBOARDING_FILES: OnboardingFile[] = [
  { path: `${ONBOARDING_FOLDER}/fatura.report.yml`, content: FATURA_REPORT },
  { path: `${ONBOARDING_FOLDER}/fatura.data.json`, content: FATURA_DATA },
  { path: `${ONBOARDING_FOLDER}/colaboradores.report.yml`, content: COLABORADORES_REPORT },
  { path: `${ONBOARDING_FOLDER}/colaboradores.data.json`, content: COLABORADORES_DATA },
  { path: `${ONBOARDING_FOLDER}/carta.cs`, content: CARTA_CS },
  { path: `${ONBOARDING_FOLDER}/carta.data.json`, content: CARTA_DATA },
  { path: `${ONBOARDING_FOLDER}/helpers.csx`, content: HELPERS_CSX },
]

/**
 * Data source pré-configurada por relatório, para que "abrir + Render" funcione de
 * imediato sem o usuário ter que escolher o JSON na mão.
 */
export const ONBOARDING_REPORT_DATA_SOURCE: Record<string, string> = {
  [`${ONBOARDING_FOLDER}/fatura.report.yml`]: `${ONBOARDING_FOLDER}/fatura.data.json`,
  [`${ONBOARDING_FOLDER}/colaboradores.report.yml`]: `${ONBOARDING_FOLDER}/colaboradores.data.json`,
  [`${ONBOARDING_FOLDER}/carta.cs`]: `${ONBOARDING_FOLDER}/carta.data.json`,
}

/** Relatório aberto automaticamente após criar os exemplos. */
export const ONBOARDING_OPEN_FIRST = `${ONBOARDING_FOLDER}/fatura.report.yml`
