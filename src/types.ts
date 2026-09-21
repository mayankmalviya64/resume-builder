export type CvPage = {
  id: string
  html: string
}

export type CvDocument = {
  title: string
  updatedAt: number
  pages: CvPage[]
}

export type SavedVersion = {
  id: string
  label: string
  savedAt: number
  document: CvDocument
}
