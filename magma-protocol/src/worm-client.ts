// WORM chain client — talks to running SnapKitty OS at localhost:3000

export interface SealResult {
  seal:         string
  previousSeal: string
  index:        number
  timestamp:    string
}

export async function sealToChain(
  osUrl: string,
  payload: Record<string, unknown>,
): Promise<SealResult | null> {
  try {
    const res = await fetch(`${osUrl}/api/labs/ledge/seal`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ payload }),
      signal:  AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.event as SealResult
  } catch {
    return null
  }
}

export async function getChainHead(osUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${osUrl}/api/merkle/head`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const data = await res.json()
    return data.head ?? data.chainHead ?? null
  } catch {
    return null
  }
}

export async function getRecentEvents(osUrl: string, limit = 10): Promise<unknown[]> {
  try {
    const res = await fetch(`${osUrl}/api/bifrost/audit?limit=${limit}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
