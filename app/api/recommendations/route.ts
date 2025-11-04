import { NextRequest, NextResponse } from "next/server";
import { discoverMovies } from "../../services/tmdb";
import { rerankMovies } from "../../services/rerank";
import { parseUserInput } from "@/services/gemini";
import { HttpError } from "@/app/services/http";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const { text = "", mood = "", moodResponse = "match" } = body;

    // 1) Parse text, mood, and moodResponse into structured params (prefer Gemini)
    let parsed: any = null;
    const normalizedMoodResponse = (moodResponse === "address" ? "address" : "match");

    try {
      parsed = await parseUserInput(text, mood, normalizedMoodResponse);
    } catch (e) {
      console.log("Gemini parse failed, using safe defaults", { text, mood, moodResponse, err: String(e) });
      parsed = null;
    }

    // Ensure parsed is always a usable object (route expects parsed.* later).
    // Do NOT call external fallback parser per request — provide conservative defaults.
    if (!parsed || typeof parsed !== "object") {
      parsed = {
        genres: [], // always an array
        keywords: [], // always an array (used for overview matching)
        tempo: undefined,
        runtime_min: undefined,
        runtime_max: undefined,
        era: undefined,
        language: null,
        adult: false,
        moodResponse: normalizedMoodResponse,
      };
    } else {
      // normalize to expected shapes
      parsed.genres = Array.isArray(parsed.genres) ? parsed.genres : [];
      parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      parsed.moodResponse = parsed.moodResponse === "address" ? "address" : "match";
      if (!("adult" in parsed)) parsed.adult = false;
    }

    // 2) Query TMDb for candidate movies using the parsed params
    const candidates = await discoverMovies(parsed, { pages: 1 });

    // 3) Rerank candidates using the parsed result and moodResponse
    const ranked = rerankMovies(candidates, {
      userText: text,
      parsed,
      mood,
      moodResponse: parsed.moodResponse || normalizedMoodResponse,
      limit: 20,
    });

    // Return both the ranked results and the parsed JSON used to fetch from TMDb
    return NextResponse.json(
      {
        results: ranked,
        parsed,
        moodResponse: parsed.moodResponse || normalizedMoodResponse,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Recommendations error:", err);

    if (err instanceof HttpError) {
      if (err.code === "TIMEOUT") {
        return NextResponse.json(
          { message: "Service timed out. Please try again.", code: "TIMEOUT" },
          { status: 503, headers: { "Retry-After": "5" } }
        );
      }
      if (err.code === "NETWORK_ERROR") {
        return NextResponse.json(
          { message: "Upstream request blocked or failed.", code: "NETWORK_ERROR" },
          { status: 502 }
        );
      }
      if (typeof err.status === "number") {
        return NextResponse.json(
          { message: "Upstream error", code: "UPSTREAM_ERROR", details: err.data },
          { status: Math.min(599, Math.max(400, err.status)) }
        );
      }
    }

    return NextResponse.json(
      { message: "Unexpected server error.", code: "UNKNOWN" },
      { status: 500 }
    );
  }
}