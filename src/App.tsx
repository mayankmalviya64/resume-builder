import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bold, Check, ChevronDown, Clock3, Download, Eye, FileImage, FilePenLine,
  FileText, Italic, Link, Plus, Printer, Redo2, Save, Sparkles, Underline, Undo2, Upload, X,
} from 'lucide-react'
import { A4Document } from './components/A4Document'
import { starterDocument } from './data'
import { getVersions, saveVersion } from './storage/indexedDb'
import type { CvDocument, SavedVersion } from './types'

const LOCAL_KEY = 'cv-studio-current-document'

function loadDocument(): CvDocument {
  try {
    const saved = localStorage.getItem(LOCAL_KEY)
    return saved ? JSON.parse(saved) : starterDocument()
  } catch {
    return starterDocument()
  }
}

export default function App() {
  const [document, setDocument] = useState<CvDocument>(loadDocument)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [savedState, setSavedState] = useState<'saved' | 'saving'>('saved')
  const [notice, setNotice] = useState('Ready')
  const [exportOpen, setExportOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [versions, setVersions] = useState<SavedVersion[]>([])
  const [overflowing, setOverflowing] = useState<Set<string>>(new Set())
  const fileInput = useRef<HTMLInputElement>(null)
  const pageElements = useRef(new Map<string, HTMLElement>())

  const persist = useCallback(async (label = 'Autosave') => {
    setSavedState('saving')
    localStorage.setItem(LOCAL_KEY, JSON.stringify(document))
    await saveVersion(document, label)
    setVersions(await getVersions())
    setSavedState('saved')
    setNotice(label === 'Autosave' ? 'Saved locally' : 'Version saved')
  }, [document])

  useEffect(() => {
    const timer = window.setTimeout(() => void persist(), 900)
    return () => window.clearTimeout(timer)
  }, [document, persist])

  useEffect(() => {
    void getVersions().then(setVersions)
  }, [])

  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        void persist('Manual save')
      }
      if (key === 'k') {
        event.preventDefault()
        createLink()
      }
      if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        documentCommand('redo')
      } else if (key === 'z') {
        event.preventDefault()
        documentCommand('undo')
      }
    }
    window.addEventListener('keydown', shortcuts)
    return () => window.removeEventListener('keydown', shortcuts)
  }, [persist])

  function documentCommand(command: string, value?: string) {
    window.document.execCommand(command, false, value)
  }

  function createLink() {
    const url = window.prompt('Paste a link')
    if (url) documentCommand('createLink', url)
  }

  function updatePage(pageId: string, html: string) {
    setDocument((current) => ({
      ...current,
      updatedAt: Date.now(),
      pages: current.pages.map((page) => page.id === pageId ? { ...page, html } : page),
    }))
    setSavedState('saving')
  }

  async function handleImport(file?: File) {
    if (!file) return
    try {
      setNotice(`Importing ${file.name}…`)
      const extension = file.name.split('.').pop()?.toLowerCase()
      // Import parsers are large, so load them only when the user chooses a file.
      const { importDocx, importPdf } = await import('./import/importers')
      const pages = extension === 'pdf' ? await importPdf(file) : await importDocx(file)
      setDocument({ title: file.name.replace(/\.(pdf|docx)$/i, ''), pages, updatedAt: Date.now() })
      setNotice(`Imported ${file.name}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not import that file')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function addPage() {
    setDocument((current) => ({
      ...current,
      updatedAt: Date.now(),
      pages: [...current.pages, { id: crypto.randomUUID(), html: '<section><h2>New section</h2><p>Start writing here…</p></section>' }],
    }))
  }

  function pagesForExport() {
    return document.pages.map((page) => pageElements.current.get(page.id)).filter((page): page is HTMLElement => Boolean(page))
  }

  async function runExport(kind: 'pdf' | 'exact' | 'editable') {
    setExportOpen(false)
    setNotice('Preparing download…')
    const safeName = document.title.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'cv'
    try {
      // Export libraries are also deferred to keep the editor's first load light.
      const { exportEditableDocx, exportExactDocx, exportPdf } = await import('./export/exporters')
      if (kind === 'pdf') await exportPdf(pagesForExport(), safeName)
      if (kind === 'exact') await exportExactDocx(pagesForExport(), safeName)
      if (kind === 'editable') await exportEditableDocx(pagesForExport(), safeName)
      setNotice('Download ready')
    } catch {
      setNotice('Export failed. Please try again.')
    }
  }

  function restore(version: SavedVersion) {
    setDocument(structuredClone(version.document))
    setHistoryOpen(false)
    setNotice(`Restored ${version.label}`)
  }

  const registerPage = useCallback((id: string, element: HTMLElement | null) => {
    if (element) pageElements.current.set(id, element)
    else pageElements.current.delete(id)
  }, [])

  const reportOverflow = useCallback((id: string, isOverflowing: boolean) => {
    setOverflowing((current) => {
      const next = new Set(current)
      if (isOverflowing) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><FileText size={20} /></div>
          <div><strong>CV Studio</strong><span>Private by design</span></div>
        </div>
        <div className="document-name">
          <input value={document.title} aria-label="Document name" onChange={(event) => setDocument({ ...document, title: event.target.value, updatedAt: Date.now() })} />
          <span className="save-state">{savedState === 'saved' ? <Check size={13} /> : <span className="spinner" />} {savedState === 'saved' ? 'Saved locally' : 'Saving'}</span>
        </div>
        <div className="top-actions">
          <button className="button ghost" onClick={() => setHistoryOpen(true)}><Clock3 size={17} /> History</button>
          <button className="button ghost" onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>
            {mode === 'edit' ? <Eye size={17} /> : <FilePenLine size={17} />} {mode === 'edit' ? 'Preview' : 'Edit'}
          </button>
          <div className="export-wrap">
            <button className="button primary export-button" aria-label="Export" onClick={() => setExportOpen(!exportOpen)}><Download size={17} /> <span>Export</span> <ChevronDown className="export-chevron" size={15} /></button>
            {exportOpen && <div className="export-menu">
              <button onClick={() => void runExport('pdf')}><FileText /><span><strong>PDF</strong><small>Pixel-matched A4 pages</small></span></button>
              <button onClick={() => void runExport('exact')}><FileImage /><span><strong>Exact visual Word</strong><small>Pages embedded as images</small></span></button>
              <button onClick={() => void runExport('editable')}><FilePenLine /><span><strong>Editable Word</strong><small>Structured text and bullets</small></span></button>
            </div>}
          </div>
        </div>
      </header>

      <div className="privacy-strip"><Sparkles size={14} /> Your CV never leaves this browser. Imports, edits, saves, and exports happen on this device.</div>

      {mode === 'edit' && <nav className="toolbar" aria-label="Formatting toolbar">
        <button title="Undo (⌘Z)" onClick={() => documentCommand('undo')}><Undo2 /></button>
        <button title="Redo (⌘⇧Z)" onClick={() => documentCommand('redo')}><Redo2 /></button><i />
        <button title="Bold (⌘B)" onClick={() => documentCommand('bold')}><Bold /></button>
        <button title="Italic (⌘I)" onClick={() => documentCommand('italic')}><Italic /></button>
        <button title="Underline (⌘U)" onClick={() => documentCommand('underline')}><Underline /></button>
        <button title="Add link (⌘K)" onClick={createLink}><Link /></button><i />
        <select aria-label="Text style" onChange={(event) => documentCommand('formatBlock', event.target.value)} defaultValue="p">
          <option value="p">Body text</option><option value="h1">Title</option><option value="h2">Section heading</option><option value="h3">Subheading</option>
        </select>
        <span className="toolbar-spacer" />
        <input ref={fileInput} hidden type="file" accept=".pdf,.docx" onChange={(event) => void handleImport(event.target.files?.[0])} />
        <button className="text-button" onClick={() => fileInput.current?.click()}><Upload /> Import PDF / DOCX</button>
        <button className="text-button" onClick={() => void persist('Manual save')}><Save /> Save</button>
      </nav>}

      <main className={mode === 'preview' ? 'workspace preview-workspace' : 'workspace'}>
        <div className="workspace-head">
          <div><span className="eyebrow">{mode === 'edit' ? 'EDITOR' : 'PRINT PREVIEW'}</span><strong>{document.pages.length} {document.pages.length === 1 ? 'page' : 'pages'} · A4</strong></div>
          {mode === 'preview' && <button className="button ghost" onClick={() => window.print()}><Printer size={17} /> Print</button>}
        </div>
        {overflowing.size > 0 && mode === 'edit' && <div className="overflow-warning">One or more pages overflow the A4 boundary. Add a page and move content before exporting.</div>}
        <A4Document pages={document.pages} editable={mode === 'edit'} onChange={updatePage} registerPage={registerPage} onOverflow={reportOverflow} />
        {mode === 'edit' && <button className="add-page" onClick={addPage}><Plus /> Add A4 page</button>}
      </main>

      <footer><span>{notice}</span><span>CV Studio · Local-first editor</span></footer>

      {historyOpen && <div className="modal-backdrop" onMouseDown={() => setHistoryOpen(false)}>
        <aside className="history-panel" onMouseDown={(event) => event.stopPropagation()}>
          <div className="panel-head"><div><span className="eyebrow">LOCAL HISTORY</span><h2>Version history</h2></div><button onClick={() => setHistoryOpen(false)}><X /></button></div>
          <p>Snapshots are stored in this browser using IndexedDB. They are not uploaded anywhere.</p>
          <button className="button primary wide" onClick={() => void persist('Named version')}>Save a version now</button>
          <div className="version-list">{versions.length === 0 ? <div className="empty">Your saved versions will appear here.</div> : versions.map((version) => (
            <button key={version.id} onClick={() => restore(version)}><span><strong>{version.label}</strong><small>{new Date(version.savedAt).toLocaleString()}</small></span><span>Restore</span></button>
          ))}</div>
        </aside>
      </div>}
    </div>
  )
}
