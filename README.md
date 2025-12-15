# PDF Offer Template Editor

A visual WYSIWYG editor for creating JSON configuration files for PDF offer generation. Upload a PDF template, click to place text fields, drag to position, and export compatible JSON instructions.

## Features

- **PDF Upload & Viewing**: Load PDF templates (10-20 pages) with page navigation and zoom controls
- **Visual Text Field Placement**: Click anywhere on the PDF to add text fields, drag to reposition
- **Multi-Select & Alignment**: Figma-style alignment tools for positioning multiple fields
- **Field Properties Panel**: Configure placeholder variables, font size, color, conditions
- **Live Preview**: See dummy data rendered on the PDF in real-time
- **Dual JSON Export**: Export both Legacy (backwards compatible) and V2 (improved) JSON formats
- **JSON Import**: Load existing JSON configurations and visualize them on the PDF
- **Image Page Management**: Configure gallery, floor plan, and unit location image insertions
- **Payment Plan Configuration**: Set up payment plan page insertions
- **Keyboard Shortcuts**: Full keyboard support for efficient workflow

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| **Selection** | |
| Select All | `Cmd/Ctrl + A` |
| Add to Selection | `Shift + Click` |
| Delete Selected | `Delete` / `Backspace` |
| Duplicate Selected | `Cmd/Ctrl + D` |
| **Alignment** | |
| Align Left | `Cmd/Ctrl + Shift + L` |
| Align Center | `Cmd/Ctrl + Shift + C` |
| Align Right | `Cmd/Ctrl + Shift + R` |
| Align Top | `Cmd/Ctrl + Shift + T` |
| Align Middle | `Cmd/Ctrl + Shift + M` |
| Align Bottom | `Cmd/Ctrl + Shift + B` |
| Distribute Horizontally | `Cmd/Ctrl + Shift + H` |
| Distribute Vertically | `Cmd/Ctrl + Shift + V` |
| **Tools** | |
| Select Tool | `V` or `S` |
| Text Tool | `T` |
| Image Tool | `I` |
| **General** | |
| Undo | `Cmd/Ctrl + Z` |
| Redo | `Cmd/Ctrl + Shift + Z` |
| Zoom In | `Cmd/Ctrl + +` |
| Zoom Out | `Cmd/Ctrl + -` |
| Nudge | `Arrow Keys` (1px) |
| Nudge Fast | `Shift + Arrow Keys` (10px) |

## Available Variables

### Unit Variables
- `{unitId}`, `{unitType}`, `{floor}`, `{beds}`
- `{bua}`, `{landArea}`, `{gardenArea}`
- `{coveredTerrace}`, `{uncoveredTerrace}`
- `{finishing}`, `{price}`

### User/Agent Variables
- `{userName}`, `{userTitle}`, `{userPhone}`, `{userEmail}`

### Offer Variables
- `{issuanceDate}`, `{paymentPlanName}`

### Payment Variables
- `{payCashTotal}`, `{payCashDiscount}`

### Image Variables
- `{offerGallery}`, `{unitLocationImage}`, `{floorPlansImagesUrl}`

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The project is configured to deploy to GitHub Pages via GitHub Actions. Push to the `main` branch to trigger automatic deployment.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- react-pdf (PDF.js)
- Zustand (state management)
