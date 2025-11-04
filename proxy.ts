import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const encoder = new TextEncoder()
const secret = encoder.encode(process.env.AUTH_JWT_SECRET ?? "")

async function verifyToken(token: string) {
  try {
    if (!secret || secret.length === 0) throw new Error("Missing AUTH_JWT_SECRET")
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export default async function middleware(req: NextRequest) {
  const token = req.cookies.get("cinemood_auth_token")?.value
  const requestHeaders = new Headers(req.headers)

  const res = NextResponse.next({ request: { headers: requestHeaders } })

  if (!token) {
    // No session; ensure any stale display cookie is gone
    res.cookies.delete("cinemood_user_name")
    return res
  }

  const payload = await verifyToken(token)
  if (!payload) {
    res.cookies.delete("cinemood_auth_token")
    res.cookies.delete("cinemood_user_name")
    return res
  }

  const user = {
    id: (payload.sub as string) ?? undefined,
    name: (payload.name as string) ?? undefined,
    email: (payload.email as string) ?? undefined,
  }

  requestHeaders.set("x-cinemood-user", JSON.stringify(user))

  const name = user.name ?? (user.email ? String(user.email).split("@")[0] : "")
  if (name) {
    const maxAge =
      typeof payload.exp === "number" ? Math.max(payload.exp - Math.floor(Date.now() / 1000), 0) : 60 * 60
    res.cookies.set("cinemood_user_name", name, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge,
    })
  } else {
    res.cookies.delete("cinemood_user_name")
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:png|jpg|jpeg|gif|svg|css|js|ico|map)).*)"],
}