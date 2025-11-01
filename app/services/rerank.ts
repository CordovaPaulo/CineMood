// small rule + keyword based reranker. Replace with ML/embedding reranker later.
type Movie = {
  id: number;
  title: string;
  overview?: string;
  popularity?: number;
  vote_average?: number;
  poster_path?: string | null;
  release_date?: string | null;
  genre_ids?: number[];
  original_language?: string | null;
  runtime?: number | null;
  trailer_youtube_id?: string | null; // added
};

export function rerankMovies(
  movies: Movie[],
  opts: { userText?: string; parsed?: any; mood?: string; moodResponse?: string; limit?: number } = {}
) {
  const { userText = "", parsed = {}, moodResponse = "match" } = opts;
  if (!movies?.length) return [];

  // force maximum results returned to 5
  const enforcedLimit = 50;

  // de-duplicate by id/title
  const seen = new Set<string | number>();
  const unique = movies.filter((m) => {
    const key = m.id ?? m.title ?? Math.random();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Normalize popularity
  const pops = unique.map((m) => m.popularity || 0);
  const maxPop = Math.max(...pops, 1);

  const keywords = ((parsed?.keywords || []) as string[]).map((k: string) => (k || "").toLowerCase());

  // simple synonym/variant expansion to allow implicit overview matches
  const SYNONYMS: Record<string, string[]> = {
    love: ["romance", "romantic", "affection", "relationship"],
    romantic: ["love", "romance", "chemistry", "relationship"],
    funny: ["comedy", "humor", "humorous", "hilarious", "laugh"],
    scary: ["horror", "terrifying", "frightening", "creepy", "spooky"],
    thrill: ["thriller", "exciting", "adrenaline", "chase", "suspense", "tense", "action"],
    action: ["thrill", "chase", "battle", "explosion", "adrenaline"],
    slow: ["quiet", "meditative", "contemplative", "introspective"],
    sad: ["tragic", "tearjerker", "melancholy", "heartbreaking", "poignant"],
    mystery: ["mysterious", "whodunit", "detective", "investigation", "enigmatic"],
    crime: ["heist", "gangster", "mafia", "police", "detective"],
    war: ["battle", "soldier", "military", "conflict"],
    space: ["sci-fi", "science fiction", "spaceship", "alien", "cosmos"],
    magic: ["fantasy", "wizard", "sorcery", "mythical"],
    family: ["kids", "children", "wholesome"],
    cozy: ["warm", "comforting", "gentle"],
    edgy: ["gritty", "noir", "dark"],
    revenge: ["vengeful", "vengeance", "retaliation"],
  };

  const morphVariants = (w: string) => {
    const v = new Set<string>([w]);
    if (w.endsWith("ing")) v.add(w.slice(0, -3));
    if (w.endsWith("ed")) v.add(w.slice(0, -2));
    if (w.endsWith("es")) v.add(w.slice(0, -2));
    if (w.endsWith("s")) v.add(w.slice(0, -1));
    (SYNONYMS[w] || []).forEach((s) => v.add(s));
    return Array.from(v);
  };

  function matchOverviewCounts(overview: string, kw: string) {
    let explicit = 0;
    let implicit = 0;
    const ov = (overview || "").toLowerCase();

    // explicit = exact word boundary match for the keyword
    const rxExact = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (rxExact.test(ov)) explicit = 1;

    // implicit = any variant/synonym/stem hit (word-boundary preferred, fallback to substring)
    if (!explicit) {
      const variants = morphVariants(kw);
      for (const v of variants) {
        const rxVar = new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (rxVar.test(ov) || ov.includes(v)) {
          implicit = 1;
          break;
        }
      }
    }
    return { explicit, implicit };
  }

  function metadataScore(m: Movie) {
    let score = 0;
    const overviewOnly = (m.overview || "").toLowerCase(); // use overview only, not title

    // keyword matches (overview only)
    let explicitHits = 0;
    let implicitHits = 0;
    for (const k of keywords) {
      if (!k) continue;
      const { explicit, implicit } = matchOverviewCounts(overviewOnly, k);
      explicitHits += explicit;
      implicitHits += implicit;
    }
    // weight explicit > implicit
    score += explicitHits * 3.0 + implicitHits * 1.2;

    // prefer popular & well-rated movies
    score += ((m.popularity || 0) / maxPop) * 2.0;
    score += (m.vote_average || 0) / 5.0;

    // rating bias: favor >6, de-prioritize <=5
    const rating = m.vote_average || 0;
    if (rating >= 6) score += 2.0;
    else if (rating <= 5) score -= 2.0;

    // parsed fields weighting (gentle nudges)
    if (parsed?.tempo) {
      if (parsed.tempo === "fast" && /action|explosion|chase|battle/.test(overviewOnly)) score += 0.8;
      if (parsed.tempo === "slow" && /drama|contemplative|quiet/.test(overviewOnly)) score += 0.6;
    }

    if (parsed?.language && parsed.language !== "null" && parsed.language === m.original_language) score += 0.5;
    if (parsed?.era && parsed.era.from && parsed.era.to && m.release_date) {
      const year = Number((m.release_date || "").slice(0, 4));
      if (!isNaN(year) && year >= parsed.era.from && year <= parsed.era.to) score += 0.7;
    }

    if (moodResponse === "address") score -= 0.25;

    return score;
  }

  const scored = unique.map((m) => {
    const base = metadataScore(m);

    // small random jitter so repeated calls produce non-identical outputs
    const jitter = (Math.random() - 0.5) * 0.002; // tiny noise
    return { movie: m, score: base + jitter };
  });

  // sort by score desc
  scored.sort((a, b) => b.score - a.score);

  // additionally rotate the results by a small random offset to diversify top-k across calls
  const arr = scored.slice(); // copy
  if (arr.length > 1) {
    const maxRotate = Math.min(arr.length, 7);
    const rotateBy = Math.floor(Math.random() * maxRotate);
    if (rotateBy > 0) {
      const head = arr.splice(0, rotateBy);
      arr.push(...head);
    }
  }

  // always return at most enforcedLimit
  return arr.slice(0, enforcedLimit).map((s) => {
    const m = s.movie;
    return {
      id: m.id,
      title: m.title,
      overview: m.overview,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      release_date: m.release_date,
      popularity: m.popularity,
      score: Math.round((s.score + Number.EPSILON) * 100) / 100,
      vote_average: m.vote_average,
      original_language: m.original_language,
      runtime: (m as any).runtime ?? null,
      trailer_youtube_id: (m as any).trailer_youtube_id ?? null, // pass through
    };
  });
}