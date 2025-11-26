import { NextRequest, NextResponse } from "next/server";
import { parseUserInput } from "@/services/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const { text = "", mood = "", moodResponse = "match" } = body;
    const normalizedMoodResponse = moodResponse === "address" ? "address" : "match";

    let parsed: any = null;
    try {
      parsed = await parseUserInput(text, mood, normalizedMoodResponse);
    } catch (e) {
      console.error('[parse] parseUserInput failed', e);
      return NextResponse.json({ message: "Failed to parse input", code: "PARSE_ERROR" }, { status: 500 });
    }

    if (!parsed || typeof parsed !== "object") {
      parsed = { ambiguous: false };
    }

    if (parsed.ambiguous) {
      return NextResponse.json({ message: "Mood unclear — please check and try again", code: "AMBIGUOUS", parsed }, { status: 400 });
    }

    return NextResponse.json({ parsed }, { status: 200 });
  } catch (err: any) {
    console.error('[parse] unexpected error', err);
    return NextResponse.json({ message: "Unexpected error", code: "UNKNOWN" }, { status: 500 });
  }
}
