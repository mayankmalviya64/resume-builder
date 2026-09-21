export type CvPage = {
  id: string
  html: string
}

export type CvDocument = {
  title: string
  updatedAt: number
  pages: CvPage[]
  margins: PageMargins
}

export type PageMargins = {
  top: number
  right: number
  bottom: number
  left: number
}

export type SavedVersion = {
  id: string
  label: string
  savedAt: number
  document: CvDocument
}
