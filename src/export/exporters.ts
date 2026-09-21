import { Document, ImageRun, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

async function capturePages(elements: HTMLElement[]) {
  return Promise.all(
    elements.map((element) => html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true })),
  )
}

export async function exportPdf(elements: HTMLElement[], filename: string) {
  const canvases = await capturePages(elements)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  canvases.forEach((canvas, index) => {
    if (index > 0) pdf.addPage('a4', 'portrait')
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, 210, 297)
  })
  pdf.save(`${filename}.pdf`)
}

export async function exportExactDocx(elements: HTMLElement[], filename: string) {
  const canvases = await capturePages(elements)
  const sections = canvases.map((canvas) => ({
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 0, right: 0, bottom: 0, left: 0 } },
    },
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            data: canvas.toDataURL('image/png'),
            transformation: { width: 794, height: 1123 },
            type: 'png',
          }),
        ],
      }),
    ],
  }))
  saveAs(await Packer.toBlob(new Document({ sections })), `${filename}-exact.docx`)
}

export async function exportEditableDocx(elements: HTMLElement[], filename: string) {
  const children: Paragraph[] = []
  elements.forEach((page, pageIndex) => {
    page.querySelectorAll('h1,h2,h3,p,li').forEach((node) => {
      const tag = node.tagName.toLowerCase()
      children.push(new Paragraph({
        heading: tag === 'h1' ? 'Title' : tag === 'h2' ? 'Heading1' : tag === 'h3' ? 'Heading2' : undefined,
        bullet: tag === 'li' ? { level: 0 } : undefined,
        children: [new TextRun({ text: node.textContent ?? '', bold: tag.startsWith('h') })],
      }))
    })
    if (pageIndex < elements.length - 1) children.push(new Paragraph({ pageBreakBefore: true }))
  })
  saveAs(await Packer.toBlob(new Document({ sections: [{ children }] })), `${filename}-editable.docx`)
}
