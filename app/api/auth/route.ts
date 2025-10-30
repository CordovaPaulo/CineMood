import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get("cinemood_auth_token");
        if (!tokenCookie) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const token = tokenCookie.value;
        const verification = await Promise.resolve(verifyToken(token));

        if (!verification) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const responseBody: any =
            typeof verification === "object" ? { authenticated: true, user: verification } : { authenticated: true };

        return NextResponse.json(responseBody, { status: 200 });
    } catch (err) {
        return NextResponse.json({ authenticated: false, error: "Token verification failed" }, { status: 401 });
    }
}

export async function POST(req: Request) {
    return GET();
}

