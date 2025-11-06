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
        ambiguous: false,
      };
    } else {
      // normalize to expected shapes
      parsed.genres = Array.isArray(parsed.genres) ? parsed.genres : [];
      parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      parsed.moodResponse = parsed.moodResponse === "address" ? "address" : "match";
      if (!("adult" in parsed)) parsed.adult = false;
      // normalize ambiguous flag
      parsed.ambiguous = Boolean(parsed.ambiguous === true);
    }

    // Additional server-side ambiguity heuristics (fallback if Gemini doesn't mark ambiguous).
    // Only apply when the client did NOT explicitly provide a mood (body.mood === "")
    // Heuristic: very short / non-informative inputs or no extracted tokens/keywords/genres -> ambiguous.
    const safeText = (text || "").trim();
    if (!mood) {
      const STOP_WORDS = new Set<string>([
        "the","and","for","with","that","this","from","want","looking","watch","movie","movies",
        "like","a","to","of","in","on","is","it","me","i","we","you","she","he","they","be","been",
        "at","by","an","as","but","or","so","if","when","while","which","who","what","where","how",
      ]);

      // tokens: words of 3+ chars (letters or digits)
      const tokens = ((safeText.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || []) as string[]).filter(
        (t: string) => !STOP_WORDS.has(t)
      );
      const tooShort = safeText.length <= 2; // e.g. "i", "ok"
      const only_pronoun_like = /^[\s]*[iImMuyUoO'"\.]{1,3}[\s]*$/.test(safeText); // crude single-token check

      const noUsefulAnchors = tokens.length === 0 && parsed.keywords.length === 0 && parsed.genres.length === 0;

      if (noUsefulAnchors || tooShort || only_pronoun_like) {
        parsed.ambiguous = true;
      }
    }

    // If parser marked the input ambiguous, stop and return an explicit error for the client
    if (parsed.ambiguous) {
      return NextResponse.json(
        { message: "Mood unclear — please be more specific in your description.", code: "AMBIGUOUS", parsed },
        { status: 400 }
      );
    }

    // 2) Query TMDb for candidate movies using the parsed params
    // Request multiple TMDb pages so we fetch ~60 candidates (20 per page) and can return 50 after rerank
    const candidates = await discoverMovies(parsed, { pages: 5 });

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