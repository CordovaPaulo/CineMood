// import { randomInt } from "crypto"; // removed (unused)

// lightweight TMDb helper: discover movies using parsed params
const TMDB_BASE = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY;

if (!KEY) {
  // keep silent in dev; runtime will fail if key missing when used
  // console.warn("TMDB_API_KEY not set");
}

type DiscoverParams = {
  genres?: string[]; // genre names from parser
  keywords?: string[]; // single-word search tokens
  runtime_min?: number;
  runtime_max?: number;
  era?: { from?: number; to?: number };
  language?: string | null;
  adult?: boolean;
  tempo?: string | null;
  // moodResponse?: "match" | "address" | null; // optional; not required
};

const GENRE_NAME_TO_ID: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Science Fiction": 878,
  "TV Movie": 10770,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

function genresToIds(genres?: string[]) {
  if (!genres?.length) return null;
  const ids = genres
    .map((g) => GENRE_NAME_TO_ID[g] ?? GENRE_NAME_TO_ID[g[0]?.toUpperCase() + g.slice(1)])
    .filter(Boolean) as number[];
  return ids.length ? ids.join(",") : null;
}

function buildDiscoverQuery(p: DiscoverParams, opts: { page?: number; sort_by?: string } = {}) {
  const qp: Record<string, string> = {
    api_key: KEY ?? "",
    sort_by: opts.sort_by ?? "popularity.desc",
    include_adult: String(Boolean(p.adult)),
    language: "en-US",
    page: String(opts.page ?? 1),
    include_video: "false",
  };

  // bias toward more-rated/popular items but require some minimum votes to reduce obscure duplicates
  qp["vote_count.gte"] = "5";
  // optional: gently lift average rating floor without hard filtering too much
  // qp["vote_average.gte"] = "5"; // keep broad; reranker heavily favors >6

  const with_genres = genresToIds(p.genres);
  if (with_genres) qp["with_genres"] = with_genres;

  if (p.runtime_min) qp["with_runtime.gte"] = String(p.runtime_min);
  if (p.runtime_max) qp["with_runtime.lte"] = String(p.runtime_max);

  if (p.era?.from) qp["primary_release_date.gte"] = `${p.era.from}-01-01`;
  if (p.era?.to) qp["primary_release_date.lte"] = `${p.era.to}-12-31`;

  return new URLSearchParams(qp).toString();
}

// fetch the best YouTube trailer id (key) for a movie
async function fetchTrailerId(movieId: number): Promise<string | null> {
  if (!KEY) return null;
  try {
    const url = `${TMDB_BASE}/movie/${movieId}/videos?api_key=${KEY}&language=en-US`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json().catch(() => null);
    if (!j || !Array.isArray(j.results)) return null;

    const vids = j.results.filter((v: any) => v?.site === "YouTube");
    const preferred =
      vids.find((v: any) => v.type === "Trailer" && (v.official || /official/i.test(v.name))) ??
      vids.find((v: any) => v.type === "Trailer") ??
      vids.find((v: any) => v.type === "Teaser") ??
      vids[0];

    return preferred?.key ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch discover results across multiple randomized pages and optionally include search results
 * for supplied keywords to increase breadth and reduce repetition.
 */
export async function discoverMovies(parsed: DiscoverParams, opts: { pages?: number } = { pages: 10 }) {
  if (!KEY) return [];

  const requestedPages = Math.max(1, Math.min(4, opts.pages ?? 10));
  const sorts = ["popularity.desc", "primary_release_date.desc", "release_date.desc", "vote_average.desc", "revenue.desc"];
  const sort_by = sorts[Math.floor(Math.random() * sorts.length)];

  const q1 = buildDiscoverQuery(parsed, { page: 1, sort_by });
  const url1 = `${TMDB_BASE}/discover/movie?${q1}`;

  try {
    const res1 = await fetch(url1);
    if (!res1.ok) return [];
    const json1 = await res1.json();
    const totalPages = Math.min(500, Number(json1.total_pages) || 1);
    const resultsAcc: any[] = Array.isArray(json1.results) ? json1.results : [];

    const pagesToFetch = new Set<number>([1]);
    while (pagesToFetch.size < Math.min(requestedPages, totalPages)) {
      pagesToFetch.add(1 + Math.floor(Math.random() * totalPages));
    }

    const otherPages = Array.from(pagesToFetch).filter((p) => p !== 1);
    const fetches = otherPages.map((p) => {
      const q = buildDiscoverQuery(parsed, { page: p, sort_by });
      return fetch(`${TMDB_BASE}/discover/movie?${q}`).then((r) => (r.ok ? r.json().catch(() => null) : null));
    });

    const otherJsons = await Promise.all(fetches);
    for (const oj of otherJsons) {
      if (oj && Array.isArray(oj.results)) resultsAcc.push(...oj.results);
    }

    // NOTE: removed title-based keyword search:
    // We no longer call /search/movie with keywords. We will match keywords against overviews only.

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const kwsNormalized = Array.isArray(parsed?.keywords)
      ? (parsed.keywords as string[]).map((k) => String(k || "").toLowerCase()).filter(Boolean)
      : [];

    // synonym/variant expansion for implicit matches
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

    const seen = new Map<number, any>();

    for (const m of resultsAcc) {
      if (!m || !m.id) continue;
      if (seen.has(m.id)) continue;

      const overview = (m.overview || "").toString();
      const overviewLower = overview.toLowerCase();

      // explicit and implicit overview matching
      let explicitCount = 0;
      let implicitCount = 0;
      const matchedKeywords: string[] = [];

      for (const kw of kwsNormalized) {
        const rx = new RegExp(`\\b${escapeRegExp(kw)}\\b`, "i");
        const explicit = rx.test(overviewLower);
        if (explicit) {
          explicitCount += 1;
          matchedKeywords.push(kw);
          continue;
        }
        const variants = morphVariants(kw);
        let implicit = false;
        for (const v of variants) {
          const rxVar = new RegExp(`\\b${escapeRegExp(v)}\\b`, "i");
          if (rxVar.test(overviewLower) || overviewLower.includes(v)) {
            implicit = true;
            break;
          }
        }
        if (implicit) {
          implicitCount += 1;
          matchedKeywords.push(kw);
        }
      }

      const voteAvg = Number(m.vote_average) || 0;
      const popularity = Number(m.popularity) || 0;
      const popScore = Math.log1p(popularity);

      // explicit hits weighted higher than implicit
      const overviewBoost = explicitCount * 5 + implicitCount * 2;

      // rating bias
      const ratingBoost = voteAvg >= 7 ? 30 : voteAvg >= 6 ? 15 : voteAvg <= 5 ? -20 : 0;

      const combinedScore = voteAvg * 10 + popScore * 2 + overviewBoost + ratingBoost;

      seen.set(m.id, {
        id: m.id,
        title: m.title,
        overview: m.overview,
        release_date: m.release_date,
        popularity: m.popularity,
        vote_average: m.vote_average,
        vote_count: m.vote_count,
        poster_path: m.poster_path,
        genre_ids: m.genre_ids,
        original_language: m.original_language,
        matched_keywords: matchedKeywords,
        _combinedScore: combinedScore,
      });
    }

    let mapped = Array.from(seen.values());
    mapped.sort((a, b) => (b._combinedScore || 0) - (a._combinedScore || 0));

    for (let i = 0; i < mapped.length - 1; i++) {
      const a = mapped[i];
      const b = mapped[i + 1];
      if (Math.abs((a._combinedScore || 0) - (b._combinedScore || 0)) < 0.001 && Math.random() < 0.15) {
        [mapped[i], mapped[i + 1]] = [mapped[i + 1], mapped[i]];
      }
    }

    const final = mapped.slice(0, 60).map((m) => {
      const { _combinedScore, ...out } = m;
      return out;
    });

    // fetch trailers for top subset and attach YouTube id
    const fetchCount = Math.min(30, final.length);
    const trailerPairs = await Promise.all(
      final.slice(0, fetchCount).map(async (m) => {
        const key = await fetchTrailerId(m.id).catch(() => null);
        return [m.id, key] as const;
      })
    );
    const trailerMap = new Map<number, string | null>(trailerPairs);

    const finalWithTrailers = final.map((m) => ({
      ...m,
      trailer_youtube_id: trailerMap.get(m.id) ?? null,
    }));

    return finalWithTrailers;
  } catch {
    return [];
  }
}