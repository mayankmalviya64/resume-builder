import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bold, Check, ChevronDown, Clock3, Download, Eye, FileImage, FilePenLine,
  FileText, Italic, Link, Printer, Redo2, RotateCcw, Save, Settings2, Sparkles, Underline, Undo2, Upload, X,
} from 'lucide-react'
import { A4Document } from './components/A4Document'
import { starterDocument } from './data'
import { clearVersions, getVersions, saveVersion } from './storage/indexedDb'
import type { CvDocument, PageMargins, SavedVersion } from './types'

const LOCAL_KEY = 'cv-studio-current-document'

function loadDocument(): CvDocument {
  try {
    const saved = localStorage.getItem(LOCAL_KEY)
    if (!saved) return starterDocument()
    const parsed = JSON.parse(saved) as Partial<CvDocument>
    return {
      ...starterDocument(),
      ...parsed,
      margins: parsed.margins ?? { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    }
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
  const [resetOpen, setResetOpen] = useState(false)
  const [pageSetupOpen, setPageSetupOpen] = useState(false)
  const [versions, setVersions] = useState<SavedVersion[]>([])
  const [overflowing, setOverflowing] = useState<Set<string>>(new Set())
  const fileInput = useRef<HTMLInputElement>(null)
  const pageElements = useRef(new Map<string, HTMLElement>())
  const paginationLock = useRef(false)

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
      pages: current.pages
        .map((page) => page.id === pageId ? { ...page, html } : page)
        // Automatically remove a later page once the user clears all of it.
        .filter((page, index) => index === 0 || page.html.replace(/<[^>]*>|&nbsp;/g, '').trim()),
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
      setDocument((current) => ({ title: file.name.replace(/\.(pdf|docx)$/i, ''), pages, margins: current.margins, updatedAt: Date.now() }))
      setNotice(`Imported ${file.name}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not import that file')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
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

  async function resetWorkspace() {
    // Reset removes only browser-local CV data; it never touches imported files.
    localStorage.removeItem(LOCAL_KEY)
    await clearVersions()
    setVersions([])
    setDocument(starterDocument())
    setResetOpen(false)
    setMode('edit')
    setNotice('Workspace reset to the starter template')
  }

  function updateMargin(side: keyof PageMargins, rawValue: string) {
    const value = Math.max(0, Math.min(2, Number(rawValue) || 0))
    setDocument((current) => ({
      ...current,
      updatedAt: Date.now(),
      margins: { ...current.margins, [side]: value },
    }))
  }

  const registerPage = useCallback((id: string, element: HTMLElement | null) => {
    if (element) pageElements.current.set(id, element)
    else pageElements.current.delete(id)
  }, [])

  const reportOverflow = useCallback((id: string, isOverflowing: boolean) => {
    if (isOverflowing && !paginationLock.current) {
      const element = pageElements.current.get(id)
      if (element) {
        const movedBlocks: string[] = []
        // Move complete top-level sections to the next page until this page fits.
        // Keeping blocks intact avoids splitting a table or heading from its body.
        while (element.scrollHeight > element.clientHeight + 2 && element.children.length > 1) {
          const lastBlock = element.lastElementChild as HTMLElement | null
          if (!lastBlock) break
          movedBlocks.unshift(lastBlock.outerHTML)
          lastBlock.remove()
        }

        if (movedBlocks.length > 0) {
          paginationLock.current = true
          const retainedHtml = element.innerHTML
          setDocument((current) => {
            const pageIndex = current.pages.findIndex((page) => page.id === id)
            if (pageIndex < 0) return current
            const pages = [...current.pages]
            pages[pageIndex] = { ...pages[pageIndex], html: retainedHtml }
            const continuation = movedBlocks.join('')
            if (pages[pageIndex + 1]) {
              pages[pageIndex + 1] = { ...pages[pageIndex + 1], html: continuation + pages[pageIndex + 1].html }
            } else {
              pages.push({ id: crypto.randomUUID(), html: continuation })
            }
            return { ...current, pages, updatedAt: Date.now() }
          })
          window.requestAnimationFrame(() => { paginationLock.current = false })
          return
        }
      }
    }

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
          <div className="brand-mark"><img src={`${import.meta.env.BASE_URL}iim-mumbai-logo.png`} alt="IIM Mumbai" /></div>
          <div><strong>CV Studio</strong><span>Private by design</span></div>
        </div>
        <div className="document-name">
          <input value={document.title} aria-label="Document name" onChange={(event) => setDocument({ ...document, title: event.target.value, updatedAt: Date.now() })} />
          <span className="save-state">{savedState === 'saved' ? <Check size={13} /> : <span className="spinner" />} {savedState === 'saved' ? 'Saved locally' : 'Saving'}</span>
        </div>
        <div className="top-actions">
          <button className="button ghost" onClick={() => setPageSetupOpen(true)}><Settings2 size={17} /> Page setup</button>
          <button className="button ghost" onClick={() => setResetOpen(true)}><RotateCcw size={17} /> Reset</button>
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
        {overflowing.size > 0 && mode === 'edit' && <div className="overflow-warning">A single content block is taller than one A4 page. Shorten or split that block so it can paginate cleanly.</div>}
        <A4Document pages={document.pages} margins={document.margins} editable={mode === 'edit'} onChange={updatePage} registerPage={registerPage} onOverflow={reportOverflow} />
      </main>

      <footer><span>{notice}</span><span>CV Studio · Local-first editor</span></footer>

      {historyOpen && <div className="modal-backdrop" onMouseDown={() => setHistoryOpen(false)}>
        <aside className="history-panel" onMouseDown={(event) => event.stopPropagation()}>
          <div className="panel-head"><div><span className="eyebrow">LOCAL HISTORY</span><h2>Version history</h2></div><button aria-label="Close" onClick={() => setHistoryOpen(false)}><X /></button></div>
          <p>Snapshots are stored in this browser using IndexedDB. They are not uploaded anywhere.</p>
          <button className="button primary wide" onClick={() => void persist('Named version')}>Save a version now</button>
          <div className="version-list">{versions.length === 0 ? <div className="empty">Your saved versions will appear here.</div> : versions.map((version) => (
            <button key={version.id} onClick={() => restore(version)}><span><strong>{version.label}</strong><small>{new Date(version.savedAt).toLocaleString()}</small></span><span>Restore</span></button>
          ))}</div>
        </aside>
      </div>}

      {resetOpen && <div className="modal-backdrop reset-backdrop" onMouseDown={() => setResetOpen(false)}>
        <section className="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="reset-icon"><RotateCcw /></div>
          <span className="eyebrow">START FRESH</span>
          <h2 id="reset-title">Reset this workspace?</h2>
          <p>This will delete the current browser-saved CV and its local version history, then restore the two-page starter. Your original PDF and DOCX files will not be changed.</p>
          <div className="reset-actions">
            <button className="button ghost" onClick={() => setResetOpen(false)}>Cancel</button>
            <button className="button destructive" onClick={() => void resetWorkspace()}>Reset workspace</button>
          </div>
        </section>
      </div>}

      {pageSetupOpen && <div className="modal-backdrop reset-backdrop" onMouseDown={() => setPageSetupOpen(false)}>
        <section className="reset-modal page-setup-modal" role="dialog" aria-modal="true" aria-labelledby="page-setup-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="reset-icon"><Settings2 /></div>
          <span className="eyebrow">A4 PAGE</span>
          <h2 id="page-setup-title">Page margins</h2>
          <p>Set each margin in inches. The default is 0.5 inches on every side.</p>
          <div className="margin-grid">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <label key={side}><span>{side}</span><div><input type="number" min="0" max="2" step="0.05" value={document.margins[side]} onChange={(event) => updateMargin(side, event.target.value)} /><small>in</small></div></label>
            ))}
          </div>
          <div className="page-setup-note">Increasing margins reduces usable space and may create a continuation page automatically.</div>
          <div className="reset-actions"><button className="button primary" onClick={() => setPageSetupOpen(false)}>Done</button></div>
        </section>
      </div>}
    </div>
  )
}
