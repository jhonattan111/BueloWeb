# Sprint F2: Report Settings Panel

## 🎯 Objetivo
Implementar painel de configurações para ajustar propriedades de página (tamanho, margens, cores, fonte) e fonte de dados, sem precisar editar código.

## ✅ Tarefas

### Frontend

#### 1. Settings Panel UI
- [ ] Separado em abas:
  - Page (tamanho, margens, orientação)
  - Style (cores, tipografia)
  - Data (data source, mock data)
  - Advanced (watermark, headers/footers)

#### 2. Page Settings Tab
- [ ] Page Size dropdown:
  - A4 (210 × 297mm)
  - Letter (8.5 × 11in)
  - Legal (8.5 × 14in)
  - Custom (input fields)
- [ ] Orientation: Portrait/Landscape radio
- [ ] Margins (cm/in selector):
  - Top, Right, Bottom, Left spinners
  - Preset presets (Normal, Narrow, Wide)
  - Show margin preview

#### 3. Style Settings Tab
- [ ] Background color picker
- [ ] Default text color picker
- [ ] Default font size (8-72pt)
- [ ] Font family selector
- [ ] Preview pane mostrando resultado

#### 4. Data Source Tab
- [ ] Global Artefacts selector (dropdown)
- [ ] JSON editor inline
- [ ] Validar JSON
- [ ] Test data button
- [ ] MockData editor

#### 5. Advanced Tab
- [ ] Watermark:
  - Text input
  - Color picker
  - Opacity slider
  - Font size
- [ ] Header/Footer toggle
- [ ] Custom CSS (futuro)

### Backend

#### 1. PageSettings Serialization
- [ ] Garantir que PageSettings salva/carrega corretamente
- [ ] Aplicar PageSettings no rendering

#### 2. ReportController Updates
- [ ] Aceitar PageSettings na requisição
- [ ] Validar PageSettings values
- [ ] Usar nas renderizações

## 🎨 PageSettings Structure Reference
```csharp
public class PageSettings
{
    public string PageSize { get; set; } = "A4";
    public float MarginHorizontal { get; set; } = 2.0f;
    public float MarginVertical { get; set; } = 2.0f;
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string DefaultTextColor { get; set; } = "#000000";
    public string? WatermarkText { get; set; }
    public string WatermarkColor { get; set; } = "#CCCCCC";
    public float WatermarkOpacity { get; set; } = 0.3f;
    public int WatermarkFontSize { get; set; } = 60;
    public int DefaultFontSize { get; set; } = 12;
    public bool ShowHeader { get; set; } = true;
    public bool ShowFooter { get; set; } = true;
}
```

## 🔄 Data Flow
```
User edits Settings
  ↓ (auto-save)
  ↓ Store PageSettings + MockData
  ↓ Send to /api/report/render
  ↓ Backend applies settings
  ↓ Render PDF with settings
  ↓ Preview updated
```

## ✅ Sprint Completion
- [ ] Todos os settings funcionam
- [ ] Preview atualiza em tempo real
- [ ] Settings persistem em template
- [ ] Validação de valores

## 🚀 Próximo Sprint
Sprint F3: Template Gallery & Organization
