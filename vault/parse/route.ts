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

function fallbackParse(text: string, mood?: string, moodResponse: "match" | "address" = "match"): ParsedParams {
  // expanded, more nuanced heuristic fallback
  const moodMap: Record<string, ParsedParams> = {
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
    Romantic: {
      genres: ["Romance", "Drama", "Comedy"],
      keywords: ["romance", "love", "chemistry", "passion", "relationship"],
      tempo: "slow",
      runtime_max: 140,
      adult: false,
    },
    Excited: {
      genres: ["Action", "Adventure", "Sci-Fi"],
      keywords: ["thrilling", "fast-paced", "adrenaline", "high stakes"],
      tempo: "fast",
      runtime_min: 80,
    },

    // additional nuanced entries
    Melancholic: {
      genres: ["Drama", "Indie"],
      keywords: ["melancholy", "wistful", "soft", "lonely", "poetic"],
      tempo: "slow",
      runtime_max: 140,
    },
    Wistful: {
      genres: ["Drama", "Romance"],
      keywords: ["wistful", "longing", "nostalgic"],
      tempo: "slow",
    },
    Empowered: {
      genres: ["Biography", "Sport", "Drama"],
      keywords: ["empowerment", "victory", "comeback", "inspiring"],
      tempo: "fast",
      runtime_max: 140,
    },
    Cozy: {
      genres: ["Family", "Drama", "Romance"],
      keywords: ["cozy", "warm", "comforting", "homey"],
      tempo: "slow",
      runtime_max: 100,
    },
    Tense: {
      genres: ["Thriller", "Crime"],
      keywords: ["tense", "suspense", "psychological", "claustrophobic"],
      tempo: "medium",
    },
    Dreamy: {
      genres: ["Fantasy", "Drama", "Art House"],
      keywords: ["dreamlike", "surreal", "moody"],
      tempo: "slow",
    },
    Playful: {
      genres: ["Comedy", "Family"],
      keywords: ["playful", "light", "funny", "zany"],
      tempo: "fast",
      adult: false,
    },
  };

  const normalize = (s?: string) =>
    (s || "").toString().trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");

  const synonyms: Record<string, string> = {
    melancholy: "Melancholic",
    wistful: "Wistful",
    sad: "Sad",
    happy: "Happy",
    joyful: "Joyful",
    relaxed: "Relaxed",
    nostalgic: "Nostalgic",
    romantic: "Romantic",
    excited: "Excited",
    tense: "Tense",
    cozy: "Cozy",
    dreamy: "Dreamy",
    playful: "Playful",
    empowered: "Empowered",
  };

  const rawMood = normalize(mood);
  const moodKey =
    rawMood && (synonyms[rawMood] || Object.keys(moodMap).find((k) => k.toLowerCase() === rawMood))
      ? synonyms[rawMood] || (Object.keys(moodMap).find((k) => k.toLowerCase() === rawMood) as string)
      : "";

  const base = moodKey && moodMap[moodKey] ? { ...moodMap[moodKey] } : {};

  // improved keyword extraction: split, keep nouns/adjectives by heuristics, limit to 10
  const kw: string[] = [];
  (text || "")
    .toLowerCase()
    .replace(/[^\w\s\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 30)
    .forEach((w) => {
      if (w.length < 3) return;
      if (["i", "feel", "am", "the", "a", "an", "and", "but", "so"].includes(w)) return;
      // keep likely meaningful tokens
      kw.push(w);
    });

  // detect explicit runtime like "90 min" or "1.5 hours" or "two hours"
  let runtime_min: number | undefined = undefined;
  let runtime_max: number | undefined = undefined;
  const runtimeMatch = text.match(/(\d{2,3})\s*(?:min|mins|minutes)/i);
  if (runtimeMatch) {
    const val = parseInt(runtimeMatch[1], 10);
    runtime_min = Math.max(0, val - 10);
    runtime_max = val + 10;
  } else {
    const hoursMatch = text.match(/(\d(?:\.\d)?)\s*(?:hour|hours|hr|hrs)/i);
    if (hoursMatch) {
      const val = Math.round(parseFloat(hoursMatch[1]) * 60);
      runtime_min = Math.max(0, val - 15);
      runtime_max = val + 15;
    } else {
      // words like "short", "long" influence runtime heuristics
      if (/\b(short|quick|snack|shorter)\b/i.test(text)) runtime_max = 90;
      if (/\b(long|epic|extended)\b/i.test(text)) runtime_min = 120;
    }
  }

  // detect era like "80s" or "1990s" or "1960s"
  let era: { from?: number; to?: number } | undefined = undefined;
  const eraMatch = text.match(/(\d{4})/);
  if (eraMatch) {
    const year = parseInt(eraMatch[1], 10);
    era = { from: Math.max(1900, year - 5), to: year + 5 };
  } else {
    const decadeMatch = text.match(/(\d{2})s\b/);
    if (decadeMatch) {
      const dec = parseInt(decadeMatch[1], 10);
      era = { from: 1900 + dec, to: 1909 + dec };
    }
  }

  // tempo inference from text sentiment keywords
  const textTempo =
    /\b(paced|fast|fast-paced|thrill|adrenaline|urgent|energetic|energetically)\b/i.test(text)
      ? "fast"
      : /\b(slow|calm|soft|gentle|moody|melancholy|meditative|relaxed|relaxing)\b/i.test(text)
      ? "slow"
      : undefined;

  // if caller asked to "address" mood, steer toward contrastive or soothing choices:
  if (moodResponse === "address") {
    // for negative moods, prefer comforting/hopeful genres
    if (/sad|angry|lonely|anxious|scared|melancholy/.test(rawMood)) {
      base.genres = base.genres ? Array.from(new Set([...base.genres, "Drama", "Family"])) : ["Drama", "Family"];
      base.keywords = base.keywords ? Array.from(new Set([...base.keywords, "comforting", "uplifting"])) : ["comforting", "uplifting"];
    }
    // for stressed/tense moods, prefer calming choices
    if (/tense|anxious|stressed/.test(rawMood)) {
      base.genres = base.genres ? Array.from(new Set([...base.genres, "Documentary", "Drama"])) : ["Documentary", "Drama"];
      base.tempo = base.tempo || "slow";
    }
  }

  const combinedKeywords = Array.from(new Set([...(base.keywords || []), ...kw])).slice(0, 12);

  const parsed: ParsedParams = {
    ...base,
    keywords: combinedKeywords,
    tempo: (base.tempo || textTempo) as ParsedParams["tempo"] | undefined,
    runtime_min: runtime_min ?? base.runtime_min,
    runtime_max: runtime_max ?? base.runtime_max,
    era: era ?? base.era,
    language: null,
    adult: base.adult ?? false,
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
      parsed = fallbackParse(text, mood, moodResponse);
    }

    // include moodResponse in the response so callers know the intended behavior
    return NextResponse.json({ parsed, moodResponse }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "nlp parse failed", detail: String(err) }, { status: 500 });
  }
}