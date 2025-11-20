import { NextRequest, NextResponse } from "next/server";
import { discoverMovies } from "../../services/tmdb";
import { rerankMovies } from "../../services/rerank";
import { parseUserInput, getGenresForMood } from "@/services/gemini";
import { HttpError } from "@/app/services/http";
import { verifyToken, decodeToken } from "@/lib/jwt";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Check authentication (same pattern as auth route)
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("cinemood_auth_token");
    
    if (!tokenCookie) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in first", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = tokenCookie.value;
    const verification = await Promise.resolve(verifyToken(token));

    if (!verification) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid token", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Decode token to get user data
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { message: "Unauthorized - Invalid token payload", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const userId = (decoded as any).userId;
    const username = (decoded as any).username;

    const body = await request.json().catch(() => ({} as any));
    const { text = "", mood = "", moodResponse = "match" } = body;

    let parsed: any = null;
    const normalizedMoodResponse = (moodResponse === "address" ? "address" : "match");

    try {
      parsed = await parseUserInput(text, mood, normalizedMoodResponse);
    } catch (e) {
      console.log("Gemini parse failed, using safe defaults", { text, mood, moodResponse, err: String(e) });
      parsed = null;
    }

    if (!parsed || typeof parsed !== "object") {
      parsed = {
        genres: [], 
        keywords: [], 
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
      parsed.genres = Array.isArray(parsed.genres) ? parsed.genres : [];
      parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      parsed.moodResponse = parsed.moodResponse === "address" ? "address" : "match";
      if (!("adult" in parsed)) parsed.adult = false;
      parsed.ambiguous = Boolean(parsed.ambiguous === true);
    }

    const safeText = (text || "").trim();

    if (safeText.length > 0) {
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

    if (safeText.length > 0 && parsed.ambiguous) {
      return NextResponse.json(
        { message: "Mood unclear — please be more specific in your description.", code: "AMBIGUOUS", parsed },
        { status: 400 }
      );
    }

    console.log("[recommendations] parsed:", {
      genres: parsed.genres,
      keywords: parsed.keywords,
      moodResponse: parsed.moodResponse,
      inferredMood: parsed.inferredMood,
    });

    const effectiveMood = mood || parsed.inferredMood || "";

    // If parser returned no genres but we have an explicit effectiveMood, try forcing
    // genres derived from the mood to avoid empty discovery queries.
    if (Array.isArray(parsed.genres) && parsed.genres.length === 0 && effectiveMood) {
      try {
        const fallbackGenres = getGenresForMood(effectiveMood, parsed.moodResponse || normalizedMoodResponse);
        if (fallbackGenres && fallbackGenres.length > 0) {
          parsed.genres = fallbackGenres;
          console.log('[recommendations] applied fallback genres from mood:', fallbackGenres);
        }
      } catch (e) {
        /* ignore */
      }
    }

    // If keywords are empty, try to populate from mood hints so we can match overviews
    if (Array.isArray(parsed.keywords) && parsed.keywords.length === 0 && effectiveMood) {
      try {
        // import getKeywordsForMood lazily to avoid cycles
        const { getKeywordsForMood } = await import("@/services/gemini");
        const fallbackKeywords = getKeywordsForMood(effectiveMood, parsed.moodResponse || normalizedMoodResponse);
        if (fallbackKeywords && fallbackKeywords.length > 0) {
          parsed.keywords = fallbackKeywords;
          console.log('[recommendations] applied fallback keywords from mood:', fallbackKeywords);
        }
      } catch (e) {
        /* ignore */
      }
    }

    let candidates = await discoverMovies(parsed, { pages: 5 });
    console.log("[recommendations] discover returned candidates:", Array.isArray(candidates) ? candidates.length : 0);

    // If discover returned no candidates, try one more time with strong mood->genre enforcement
    if ((!candidates || candidates.length === 0) && effectiveMood) {
      const forced = { ...parsed, genres: getGenresForMood(effectiveMood, parsed.moodResponse || normalizedMoodResponse) };
      console.log('[recommendations] discover returned 0, retrying with forced genres:', forced.genres);
      candidates = await discoverMovies(forced, { pages: 5 });
      console.log('[recommendations] retry discover returned candidates:', Array.isArray(candidates) ? candidates.length : 0);
      if (!candidates || candidates.length === 0) {
        return NextResponse.json(
          { message: 'No recommendations available for that mood right now.', code: 'NO_RESULTS', parsed, mood: effectiveMood },
          { status: 502 }
        );
      }
    }

    const ranked = rerankMovies(candidates, {
      userText: text,
      parsed,
      mood: effectiveMood,
      moodResponse: parsed.moodResponse || normalizedMoodResponse,
      limit: 20,
    });
    console.log("[recommendations] reranked results:", Array.isArray(ranked) ? ranked.length : 0);

    // If reranker produced no results, surface a clear error to the client
    if (!Array.isArray(ranked) || ranked.length === 0) {
      console.log('[recommendations] no ranked results, returning NO_RESULTS');
      return NextResponse.json(
        { message: 'No recommendations available for that mood right now.', code: 'NO_RESULTS', parsed, mood: effectiveMood },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        results: ranked,
        parsed,
        moodResponse: parsed.moodResponse || normalizedMoodResponse,
        mood: effectiveMood,
        userId, // Include userId for client-side history saving
        username, // Optional: include username if needed
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