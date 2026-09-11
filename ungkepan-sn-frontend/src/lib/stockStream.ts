import { API_BASE, checkApi } from '../api/client'

export type StockMap = Record<string, number>

type StockListener = (stocks: StockMap) => void

const listeners = new Set<StockListener>()
let pollTimer: ReturnType<typeof setInterval> | null = null
let current: StockMap = {}

function applyData(data: any) {
  if (!data || data?.type !== 'stock' || !Array.isArray(data.products)) return
  const map: StockMap = {}
  for (const p of data.products) {
    if (p && p.id != null && typeof p.stock === 'number') {
      map[String(p.id)] = p.stock
    }
  }
  current = map
  listeners.forEach((fn) => fn(current))
}

async function pollOnce() {
  if (!(await checkApi())) return
  try {
    const res = await fetch(`${API_BASE}/stock-snapshot.php`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    })
    if (res.ok) {
      applyData(await res.json())
    }
  } catch {
    // backend down — biarkan poll berikutnya coba lagi, jangan spam
  }
}

function startPolling() {
  if (pollTimer) return
  pollOnce()
  pollTimer = setInterval(() => {
    if (document.hidden) return
    pollOnce()
  }, 5_000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

export function subscribeStock(cb: StockListener): () => void {
  listeners.add(cb)
  startPolling()
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0) stopPolling()
  }
}