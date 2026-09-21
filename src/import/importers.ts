import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import type { CvPage } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const makeId = () => crypto.randomUUID()

export async function importPdf(file: File): Promise<CvPage[]> {
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: CvPage[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    // PDF text has visual coordinates but weak semantics. New lines are retained
    // so the imported content remains usable even when the original structure is lost.
    const lines: string[] = []
    let currentY: number | undefined
    let currentLine = ''
    for (const item of content.items) {
      if (!('str' in item)) continue
      const y = item.transform[5]
      if (currentY !== undefined && Math.abs(y - currentY) > 4) {
        if (currentLine.trim()) lines.push(currentLine.trim())
        currentLine = ''
      }
      currentLine += `${item.str} `
      currentY = y
    }
    if (currentLine.trim()) lines.push(currentLine.trim())
    const html = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')
    pages.push({ id: makeId(), html: html || '<p>Blank imported page</p>' })
  }
  return pages
}

export async function importDocx(file: File): Promise<CvPage[]> {
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
  return [{ id: makeId(), html: result.value || '<p>Blank imported document</p>' }]
}

function escapeHtml(value: string) {
  const element = document.createElement('div')
  element.textContent = value
  return element.innerHTML
}
