import { jwtVerify, type JWTPayload } from "jose"
import { cookies as nextCookies } from "next/headers"

export type AuthUser = {
  userId?: string
  name?: string
  email?: string
}

let secretBytes: Uint8Array | null = null
function getSecret(): Uint8Array {
  if (secretBytes) return secretBytes
  const s = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || ""
  if (!s) throw new Error("Missing AUTH_JWT_SECRET")
  secretBytes = new TextEncoder().encode(s)
  return secretBytes
}

export function extractBearer(token?: string | null): string | null {
  if (!token) return null
  const t = token.trim()
  return t
}

export async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export function normalizeUser(payload: JWTPayload): AuthUser {
  const email = (payload.email as string) || undefined
  const name =
    (payload.name as string) ??
    (payload.username as string) ??
    (payload.userName as string) ??
    (payload.preferred_username as string) ??
    (payload.given_name as string) ??
    (email ? email.split("@")[0] : undefined)
  return {
    userId: (payload.sub as string) || undefined,
    name: name || undefined,
    email,
  }
}

export async function getUserFromCookies(cookiesLike: {
  get(name: string): { value: string } | string | undefined
}): Promise<AuthUser | null> {
  const entry = cookiesLike.get("cinemood_auth_token")
  const raw = typeof entry === "string" ? entry : entry?.value
  const token = extractBearer(raw)
  if (!token) return null
  const payload = await verifyJwt(token)
  return payload ? normalizeUser(payload) : null
}

export async function getUserFromRequest(req: {
  cookies: { get(name: string): { value: string } | string | undefined }
}) {
  return getUserFromCookies(req.cookies)
}

export async function getUserFromServerCookies() {
  try {
    const bag = await nextCookies() // async on your Next.js version
    return getUserFromCookies(bag)
  } catch {
    return null
  }
}