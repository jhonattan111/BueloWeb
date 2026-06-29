# Sprint F2: Report Settings Panel

## 🎯 Objective
Implement a settings panel to adjust page properties (size, margins, colors, font) and the data source, without needing to edit code.

## ✅ Tasks

### Frontend

#### 1. Settings Panel UI
- [ ] Split into tabs:
  - Page (size, margins, orientation)
  - Style (colors, typography)
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
  - Presets (Normal, Narrow, Wide)
  - Show margin preview

#### 3. Style Settings Tab
- [ ] Background color picker
- [ ] Default text color picker
- [ ] Default font size (8-72pt)
- [ ] Font family selector
- [ ] Preview pane showing the result

#### 4. Data Source Tab
- [ ] Global Artefacts selector (dropdown)
- [ ] Inline JSON editor
- [ ] Validate JSON
- [ ] Test data button
- [ ] MockData editor

#### 5. Advanced Tab
- [ ] Watermark:
  - Text input
  - Color picker
  - Opacity slider
  - Font size
- [ ] Header/Footer toggle
- [ ] Custom CSS (future)

### Backend

#### 1. PageSettings Serialization
- [ ] Ensure PageSettings saves/loads correctly
- [ ] Apply PageSettings during rendering

#### 2. ReportController Updates
- [ ] Accept PageSettings in the request
- [ ] Validate PageSettings values
- [ ] Use them in renderings

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
- [ ] All settings work
- [ ] Preview updates in real time
- [ ] Settings persist in the template
- [ ] Value validation

## 🚀 Next Sprint
Sprint F3: Template Gallery & Organization
