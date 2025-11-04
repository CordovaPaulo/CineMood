export function isNavigatorOnline(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return true
  return navigator.onLine
}

export async function pingBackend(timeoutMs = 2500): Promise<{ ok: boolean; status?: number }> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch("/api/health", {
      method: "GET",
      cache: "no-store",
      signal: ac.signal,
    })
    return { ok: res.ok, status: res.status }
  } catch {
    return { ok: false }
  } finally {
    clearTimeout(t)
  }
}

/**
 * Returns:
 * - "offline" if browser is offline
 * - "backend-down" if browser is online but health check fails
 * - "ok" otherwise
 */
export async function verifyClientConnectivity(): Promise<"ok" | "offline" | "backend-down"> {
  if (!isNavigatorOnline()) return "offline"
  const health = await pingBackend()
  return health.ok ? "ok" : "backend-down"
}