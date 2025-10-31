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

  function metadataScore(m: Movie) {
    let score = 0;
    const hay = ((m.title || "") + " " + (m.overview || "")).toLowerCase();

    // keyword matches
    for (const k of keywords) {
      if (!k) continue;
      if (hay.includes(k)) score += 3;
      // partial match
      if (k.length >= 4 && hay.includes(k.slice(0, 4))) score += 0.6;
    }

    // prefer popular & well-rated movies
    score += ((m.popularity || 0) / maxPop) * 2.0;
    score += (m.vote_average || 0) / 5.0;

    // parsed fields weighting (gentle nudges)
    if (parsed?.tempo) {
      if (parsed.tempo === "fast" && /action|explosion|chase|battle/.test(hay)) score += 0.8;
      if (parsed.tempo === "slow" && /drama|contemplative|quiet/.test(hay)) score += 0.6;
    }

    if (parsed?.language && parsed.language !== "null" && parsed.language === m.original_language) score += 0.5;
    if (parsed?.era && parsed.era.from && parsed.era.to && m.release_date) {
      const year = Number((m.release_date || "").slice(0, 4));
      if (!isNaN(year) && year >= parsed.era.from && year <= parsed.era.to) score += 0.7;
    }

    // slight moodResponse penalty for "address" (prefer contrast)
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
    };
  });
}