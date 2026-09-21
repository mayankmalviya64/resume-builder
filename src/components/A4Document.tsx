import { useEffect, useLayoutEffect, useRef } from 'react'
import type { CvPage } from '../types'

type Props = {
  pages: CvPage[]
  editable: boolean
  onChange?: (pageId: string, html: string) => void
  registerPage?: (pageId: string, element: HTMLElement | null) => void
  onOverflow?: (pageId: string, overflowing: boolean) => void
}

function A4Page({ page, editable, onChange, registerPage, onOverflow }: Omit<Props, 'pages'> & { page: CvPage }) {
  const ref = useRef<HTMLDivElement>(null)

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
        contentEditable={editable}
        suppressContentEditableWarning
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
