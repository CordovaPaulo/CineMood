import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromCookies } from "@/services/jwt"

export const dynamic = "force-dynamic"

export async function GET() {
  const cookieStore = await cookies()
  const user = await getUserFromCookies(cookieStore)
  return NextResponse.json(
    { user: user ?? null },
    { headers: { "Cache-Control": "no-store", Vary: "Cookie" } }
  )
}