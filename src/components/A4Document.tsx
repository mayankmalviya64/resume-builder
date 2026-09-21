import { useEffect, useLayoutEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import type { CvPage, PageMargins } from '../types'

type Props = {
  pages: CvPage[]
  margins: PageMargins
  editable: boolean
  onChange?: (pageId: string, html: string) => void
  registerPage?: (pageId: string, element: HTMLElement | null) => void
  onOverflow?: (pageId: string, overflowing: boolean) => void
}

function A4Page({ page, margins, editable, onChange, registerPage, onOverflow }: Omit<Props, 'pages'> & { page: CvPage }) {
  const ref = useRef<HTMLDivElement>(null)

  function cellAtResizeEdge(target: EventTarget | null, pointerX: number) {
    const cell = target instanceof Element ? target.closest('th,td') as HTMLTableCellElement | null : null
    if (!cell || !ref.current?.contains(cell)) return null
    const row = cell.parentElement as HTMLTableRowElement | null
    const nextCell = row?.cells[cell.cellIndex + 1]
    const nearEdge = Math.abs(cell.getBoundingClientRect().right - pointerX) <= 7
    return nearEdge && nextCell && cell.colSpan === 1 && nextCell.colSpan === 1 ? cell : null
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!editable) return
    event.currentTarget.style.cursor = cellAtResizeEdge(event.target, event.clientX) ? 'col-resize' : 'text'
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!editable) return
    const cell = cellAtResizeEdge(event.target, event.clientX)
    const table = cell?.closest('table')
    const referenceRow = table?.rows[0]
    if (!cell || !table || !referenceRow) return

    event.preventDefault()
    const columnCount = Array.from(referenceRow.cells).reduce((total, item) => total + item.colSpan, 0)
    let colgroup = table.querySelector(':scope > colgroup')
    if (!colgroup) {
      colgroup = document.createElement('colgroup')
      for (let index = 0; index < columnCount; index += 1) colgroup.append(document.createElement('col'))
      table.prepend(colgroup)
    }
    const columns = Array.from(colgroup.children) as HTMLTableColElement[]
    const columnIndex = cell.cellIndex
    if (!columns[columnIndex + 1]) return

    const tableWidth = table.getBoundingClientRect().width
    const currentWidth = cell.getBoundingClientRect().width / tableWidth * 100
    const nextCell = cell.parentElement?.children[columnIndex + 1] as HTMLElement
    const nextWidth = nextCell.getBoundingClientRect().width / tableWidth * 100
    const startX = event.clientX

    const resize = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) / tableWidth * 100
      const adjustedCurrent = Math.max(5, Math.min(currentWidth + nextWidth - 5, currentWidth + delta))
      columns[columnIndex].style.width = `${adjustedCurrent}%`
      columns[columnIndex + 1].style.width = `${currentWidth + nextWidth - adjustedCurrent}%`
    }
    const finish = () => {
      window.removeEventListener('pointermove', resize)
      window.removeEventListener('pointerup', finish)
      if (ref.current) onChange?.(page.id, ref.current.innerHTML)
    }
    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', finish, { once: true })
  }

  // CSS inches would not scale with the responsive page preview. Converting the
  // chosen inch values to container-width units keeps screen and print identical.
  const marginStyle = {
    '--margin-top': `${margins.top / 8.267 * 100}cqw`,
    '--margin-right': `${margins.right / 8.267 * 100}cqw`,
    '--margin-bottom': `${margins.bottom / 8.267 * 100}cqw`,
    '--margin-left': `${margins.left / 8.267 * 100}cqw`,
  } as CSSProperties

  useLayoutEffect(() => {
    const element = ref.current
    // Do not replace the live DOM while the user is typing; doing so moves the
    // caret. State-driven restores and imports still update inactive pages.
    if (element && window.document.activeElement !== element && element.innerHTML !== page.html) {
      element.innerHTML = page.html
    }
  }, [page.html])

  useEffect(() => {
    registerPage?.(page.id, ref.current)
    return () => registerPage?.(page.id, null)
  }, [page.id, registerPage])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const reportOverflow = () => onOverflow?.(page.id, element.scrollHeight > element.clientHeight + 2)
    reportOverflow()
    const observer = new ResizeObserver(reportOverflow)
    observer.observe(element)
    return () => observer.disconnect()
  }, [page.html, page.id, onOverflow])

  return (
    <article className="a4-shell">
      <div
        ref={ref}
        className="a4-page"
        style={marginStyle}
        contentEditable={editable}
        suppressContentEditableWarning
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onInput={(event) => onChange?.(page.id, event.currentTarget.innerHTML)}
      />
    </article>
  )
}

export function A4Document(props: Props) {
  return (
    <div className={`document-stack ${props.editable ? 'is-editable' : ''}`}>
      {props.pages.map((page) => <A4Page key={page.id} page={page} {...props} />)}
    </div>
  )
}
