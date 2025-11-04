export class HttpError extends Error {
  status?: number
  code?: string
  data?: any
  constructor(message: string, opts?: { status?: number; code?: string; data?: any }) {
    super(message)
    this.name = "HttpError"
    this.status = opts?.status
    this.code = opts?.code
    this.data = opts?.data
  }
}

export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const controller = new AbortController()
  const timeoutMs = init?.timeoutMs ?? 8000
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(input, { ...init, signal: controller.signal })
    if (!res.ok) {
      let data: any = null
      try {
        data = await res.clone().json()
      } catch {
        try {
          data = await res.clone().text()
        } catch {}
      }
      throw new HttpError(`HTTP ${res.status}`, { status: res.status, code: "HTTP_ERROR", data })
    }
    return res
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new HttpError("Request timed out", { code: "TIMEOUT" })
    }
    // TypeError: Failed to fetch => blocked/cors/network
    throw new HttpError("Network/blocked request", { code: "NETWORK_ERROR" })
  } finally {
    clearTimeout(id)
  }
}