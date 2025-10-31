import { NextResponse } from "next/server";
import { parseContents } from "@/services/gemini";

type ParsedParams = {
  genres?: string[];
  keywords?: string[];
  tempo?: "slow" | "medium" | "fast";
  runtime_min?: number;
  runtime_max?: number;
  era?: { from?: number; to?: number };
  language?: string | null;
  adult?: boolean;
};

function fallbackParse(text: string, mood?: string): ParsedParams {
    // lightweight heuristic mapping as a safe fallback
    const moodMap: Record<string, ParsedParams> = {
    // 🌞 Positive / Uplifting States
    Happy: {
        genres: ["Comedy", "Family", "Music"],
        keywords: ["feel-good", "uplifting", "optimistic", "celebration", "friendship"],
        tempo: "medium",
        runtime_max: 120,
        adult: false,
    },
    Joyful: {
        genres: ["Comedy", "Animation", "Adventure"],
        keywords: ["joyful", "heartwarming", "wholesome", "funny"],
        tempo: "fast",
        runtime_max: 110,
        adult: false,
    },
    Relaxed: {
        genres: ["Drama", "Romance", "Comedy"],
        keywords: ["calm", "soothing", "light-hearted", "slice of life", "peaceful"],
        tempo: "slow",
        runtime_max: 120,
        adult: false,
    },
    Hopeful: {
        genres: ["Drama", "Biography", "Documentary"],
        keywords: ["inspiring", "triumph", "resilience", "determination"],
        tempo: "medium",
        runtime_max: 150,
    },

    // 💔 Sad / Reflective
    Sad: {
        genres: ["Drama", "Romance"],
        keywords: ["emotional", "bittersweet", "heartfelt", "tearjerker"],
        tempo: "slow",
        runtime_max: 140,
    },
    Lonely: {
        genres: ["Drama", "Romance", "Animation"],
        keywords: ["solitude", "self-discovery", "melancholic", "introspective"],
        tempo: "slow",
        runtime_max: 150,
    },
    Nostalgic: {
        genres: ["Drama", "Romance", "Family"],
        keywords: ["nostalgia", "memory", "past", "reminiscence", "coming-of-age"],
        tempo: "slow",
        runtime_max: 140,
    },

    // ❤️ Romantic / Intimate
    Romantic: {
        genres: ["Romance", "Drama", "Comedy"],
        keywords: ["romance", "love", "chemistry", "passion", "relationship"],
        tempo: "slow",
        runtime_max: 140,
        adult: false,
    },
    Heartbroken: {
        genres: ["Drama", "Romance"],
        keywords: ["breakup", "grief", "lost love", "regret"],
        tempo: "slow",
        runtime_max: 150,
    },
    Flirty: {
        genres: ["Romance", "Comedy"],
        keywords: ["romcom", "charming", "playful", "dating"],
        tempo: "medium",
        runtime_max: 120,
        adult: false,
    },

    // ⚡ Energetic / Action-Oriented
    Excited: {
        genres: ["Action", "Adventure", "Sci-Fi"],
        keywords: ["thrilling", "fast-paced", "adrenaline", "high stakes"],
        tempo: "fast",
        runtime_min: 80,
    },
    Adventurous: {
        genres: ["Adventure", "Action", "Fantasy"],
        keywords: ["epic", "journey", "exploration", "quest"],
        tempo: "fast",
    },
    Motivated: {
        genres: ["Sport", "Biography", "Drama"],
        keywords: ["determination", "ambition", "achievement", "comeback"],
        tempo: "fast",
        runtime_max: 130,
    },

    // 😨 Fear / Suspense
    Scared: {
        genres: ["Horror", "Thriller"],
        keywords: ["suspense", "jumpscare", "dark", "terror", "supernatural"],
        tempo: "fast",
        adult: false,
    },
    Anxious: {
        genres: ["Thriller", "Mystery", "Psychological"],
        keywords: ["tension", "paranoia", "isolation", "claustrophobic"],
        tempo: "medium",
    },
    Mysterious: {
        genres: ["Mystery", "Thriller", "Crime"],
        keywords: ["puzzle", "twist", "detective", "whodunit"],
        tempo: "medium",
    },

    // 😡 Anger / Intensity
    Angry: {
        genres: ["Action", "Crime", "Thriller"],
        keywords: ["revenge", "intense", "conflict", "vengeance", "justice"],
        tempo: "fast",
    },
    Frustrated: {
        genres: ["Action", "Drama"],
        keywords: ["struggle", "chaos", "rage", "overcoming adversity"],
        tempo: "medium",
    },

    // 🌌 Deep / Thoughtful / Existential
    Curious: {
        genres: ["Documentary", "Mystery", "Sci-Fi"],
        keywords: ["questioning", "exploration", "philosophical", "discovery"],
        tempo: "medium",
    },
    Thoughtful: {
        genres: ["Drama", "Science Fiction"],
        keywords: ["introspective", "existential", "mind-bending"],
        tempo: "slow",
    },
    Bored: {
        genres: ["Comedy", "Adventure"],
        keywords: ["fun", "random", "entertaining", "unpredictable"],
        tempo: "fast",
        runtime_max: 120,
    },
    };

  const base = mood && moodMap[mood] ? moodMap[mood] : {};
  // quick keyword extraction from text (very small, safe)
  const kw: string[] = [];
  ;(text || "")
    .toLowerCase()
    .split(/[,.;\n]/)
    .slice(0, 6)
    .forEach((part) => {
      const s = part.trim();
      if (!s) return;
      if (s.length < 4) return;
      // keep as candidate keyword if it looks meaningful
      kw.push(...s.split(/\s+/).slice(0, 2));
    });

  const parsed: ParsedParams = {
    ...base,
    keywords: Array.from(new Set([...(base.keywords || []), ...kw])).slice(0, 8),
    language: null,
  };
  return parsed;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const text = (body.text || "").toString();
    const mood = (body.mood || "").toString();
    // new: read moodResponse (default "match")
    const moodResponse = (body.moodResponse || "match").toString() === "address" ? "address" : "match";

    let parsed: ParsedParams | null = null;

    try {
    //   pass moodResponse into the parser so LLM can consider whether to "match" or "address" mood
      const ml = await parseContents(text, { mood, moodResponse });
      parsed = typeof ml === "object" ? (ml as ParsedParams) : null;
    } catch (e) {
      parsed = fallbackParse(text, mood);
    }

    // include moodResponse in the response so callers know the intended behavior
    return NextResponse.json({ parsed, moodResponse }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "nlp parse failed", detail: String(err) }, { status: 500 });
  }
}