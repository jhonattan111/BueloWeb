# Sprint F2 (Frontend) — Report Settings Panel

## Goal
Implement a settings panel to adjust page properties (size, margins, colors, font) and the data
source, without needing to edit code.

## Status
`[x] done`

## Dependencies
- Sprint F1 (Monaco Editor C#; real-time validation; PDF preview; template gallery) — settings panel
  builds on the editor shell delivered there

## Scope

**Frontend — Settings Panel UI:**
- [x] Split into tabs:
  - Page (size, margins, orientation)
  - Style (colors, typography)
  - Data (data source, mock data)
  - Advanced (watermark, headers/footers)

**Frontend — Page Settings Tab:**
- [x] Page Size dropdown:
  - A4 (210 × 297mm)
  - Letter (8.5 × 11in)
  - Legal (8.5 × 14in)
  - Custom (input fields)
- [x] Orientation: Portrait/Landscape radio
- [x] Margins (cm/in selector):
  - Top, Right, Bottom, Left spinners
  - Presets (Normal, Narrow, Wide)
  - Show margin preview

**Frontend — Style Settings Tab:**
- [x] Background color picker
- [x] Default text color picker
- [x] Default font size (8-72pt)
- [x] Font family selector
- [x] Preview pane showing the result

**Frontend — Data Source Tab:**
- [x] Global Artefacts selector (dropdown)
- [x] Inline JSON editor
- [x] Validate JSON
- [x] Test data button
- [x] MockData editor

**Frontend — Advanced Tab:**
- [x] Watermark:
  - Text input
  - Color picker
  - Opacity slider
  - Font size
- [x] Header/Footer toggle
- [x] Custom CSS (future)

**Backend — PageSettings Serialization:**
- [x] Ensure PageSettings saves/loads correctly
- [x] Apply PageSettings during rendering

**Backend — ReportController Updates:**
- [x] Accept PageSettings in the request
- [x] Validate PageSettings values
- [x] Use them in renderings

## Notes

`PageSettings` structure reference:
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

Data flow:
```
User edits Settings
  ↓ (auto-save)
  ↓ Store PageSettings + MockData
  ↓ Send to /api/report/render
  ↓ Backend applies settings
  ↓ Render PDF with settings
  ↓ Preview updated
```
