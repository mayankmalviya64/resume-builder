# CV Studio

A private, browser-based A4 CV editor. Import PDF or DOCX files, edit them locally, preview the exact page layout, and export to PDF or Word without uploading personal information to a server.

## Features

- A4 rich-text editing with standard keyboard shortcuts
- PDF text extraction and DOCX import
- Shared renderer for editing, preview, PDF, and exact visual Word output
- Editable Word export for common text structures
- Local autosave and IndexedDB version history
- Multi-page documents with overflow warnings
- Two-page IIM-style starter with compact tables and achievement-led sections
- GitHub Pages deployment workflow

## Run locally

```bash
npm install
npm run dev
```

Then open the local address printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Privacy

All document processing happens in the browser. CV Studio has no backend and does not upload imported files or saved versions.

## Import fidelity

DOCX files usually retain useful document structure. PDF files primarily describe visual positions, so imported PDF text may need manual formatting after extraction.
