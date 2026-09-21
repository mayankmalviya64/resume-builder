import type { CvDocument, SavedVersion } from '../types'

const DATABASE = 'cv-studio'
const STORE = 'versions'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveVersion(document: CvDocument, label: string): Promise<SavedVersion> {
  const version: SavedVersion = {
    // Reuse one slot for autosave so normal typing does not create thousands of snapshots.
    id: label === 'Autosave' ? 'autosave' : crypto.randomUUID(),
    label,
    savedAt: Date.now(),
    document: structuredClone(document),
  }
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(version)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
  return version
}

export async function getVersions(): Promise<SavedVersion[]> {
  const database = await openDatabase()
  const versions = await new Promise<SavedVersion[]>((resolve, reject) => {
    const request = database.transaction(STORE).objectStore(STORE).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  database.close()
  return versions.sort((a, b) => b.savedAt - a.savedAt)
}

export async function clearVersions(): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}
