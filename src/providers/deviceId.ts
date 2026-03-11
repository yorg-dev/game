// ---------------------------------------------------------------------------
// deviceId — stable cross-session identity for guest visitors
//
// Stored in both localStorage AND IndexedDB so the ID survives if either
// store is cleared independently (e.g. "Clear cookies" vs "Clear site data").
// The backend uses this to restore an existing guest session for a returning
// visitor rather than creating a new one.
// ---------------------------------------------------------------------------

const LS_KEY = 'deviceId'
const IDB_DB = 'slaivs'
const IDB_VER = 1
const IDB_STORE = 'meta'
const IDB_KEY = 'deviceId'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, IDB_VER)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(): Promise<string | null> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
      req.onsuccess = () => resolve((req.result as string) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function idbSet(id: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      const req = tx.objectStore(IDB_STORE).put(id, IDB_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // IndexedDB unavailable (e.g. Firefox private mode) — localStorage alone is enough
  }
}

/**
 * Clears the stored device ID from both localStorage and IndexedDB.
 * Call this on logout so the next guest session gets a fresh identity.
 */
export async function clearDeviceId(): Promise<void> {
  localStorage.removeItem(LS_KEY)
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      const req = tx.objectStore(IDB_STORE).delete(IDB_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // Ignore — localStorage was already cleared above
  }
}

/**
 * Returns the stable device ID for this browser, creating one on first call.
 *
 * Resolution order:
 *   1. localStorage  (fast, cleared by "Clear cookies")
 *   2. IndexedDB     (survives cookie clears, cleared by "Clear site data")
 *   3. Generate new  (stores in both)
 */
export async function getDeviceId(): Promise<string> {
  const fromLocal = localStorage.getItem(LS_KEY)
  if (fromLocal) {
    // Back-fill IndexedDB in case it was cleared
    idbSet(fromLocal)
    return fromLocal
  }

  const fromIdb = await idbGet()
  if (fromIdb) {
    localStorage.setItem(LS_KEY, fromIdb)
    return fromIdb
  }

  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
        })
  localStorage.setItem(LS_KEY, id)
  await idbSet(id)
  return id
}
