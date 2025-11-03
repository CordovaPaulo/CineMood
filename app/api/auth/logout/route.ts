import { NextResponse } from "next/server"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete("cinemood_auth_token")
  res.cookies.delete("cinemood_user_name")
  return res
}