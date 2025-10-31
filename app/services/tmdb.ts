import { randomInt } from "crypto";

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

  const with_genres = genresToIds(p.genres);
  if (with_genres) qp["with_genres"] = with_genres;

  if (p.runtime_min) qp["with_runtime.gte"] = String(p.runtime_min);
  if (p.runtime_max) qp["with_runtime.lte"] = String(p.runtime_max);

  if (p.era?.from) qp["primary_release_date.gte"] = `${p.era.from}-01-01`;
  if (p.era?.to) qp["primary_release_date.lte"] = `${p.era.to}-12-31`;

  return new URLSearchParams(qp).toString();
}

/**
 * Fetch discover results across multiple randomized pages and optionally include search results
 * for supplied keywords to increase breadth and reduce repetition.
 */
export async function discoverMovies(parsed: DiscoverParams, opts: { pages?: number } = { pages: 10 }) {
  if (!KEY) return [];

  const requestedPages = Math.max(1, Math.min(4, opts.pages ?? 10)); // fetch up to 4 pages for breadth
  const sorts = [
    "popularity.desc",
    "primary_release_date.desc",
    "release_date.desc",
    "vote_average.desc",
    "revenue.desc",
  ];

  // pick sort (randomized to diversify results)
  const sort_by = sorts[Math.floor(Math.random() * sorts.length)];

  // 1) initial discover to learn total_pages (use page 1)
  const q1 = buildDiscoverQuery(parsed, { page: 1, sort_by });
  const url1 = `${TMDB_BASE}/discover/movie?${q1}`;

  try {
    const res1 = await fetch(url1);
    if (!res1.ok) return [];
    const json1 = await res1.json();
    const totalPages = Math.min(500, Number(json1.total_pages) || 1); // TMDb caps at 500
    const resultsAcc: any[] = Array.isArray(json1.results) ? json1.results : [];

    // choose additional distinct random pages (including page 1)
    const pagesToFetch = new Set<number>();
    pagesToFetch.add(1);
    while (pagesToFetch.size < Math.min(requestedPages, totalPages)) {
      pagesToFetch.add(1 + Math.floor(Math.random() * totalPages));
    }

    // fetch chosen pages in parallel (skip page 1 which we already fetched)
    const otherPages = Array.from(pagesToFetch).filter((p) => p !== 1);
    const fetches = otherPages.map((p) => {
      const q = buildDiscoverQuery(parsed, { page: p, sort_by });
      return fetch(`${TMDB_BASE}/discover/movie?${q}`).then((r) => r.ok ? r.json().catch(() => null) : null);
    });

    const otherJsons = await Promise.all(fetches);
    for (const oj of otherJsons) {
      if (oj && Array.isArray(oj.results)) resultsAcc.push(...oj.results);
    }

    // 2) optionally include search results for up to two top keywords to broaden coverage (keeps title/overview search)
    if (parsed.keywords && parsed.keywords.length > 0) {
      const kws = parsed.keywords.slice(0, 2);
      const searchFetches = kws.map((kw) =>
        fetch(`${TMDB_BASE}/search/movie?api_key=${KEY}&language=en-US&query=${encodeURIComponent(kw)}&page=1&include_adult=${String(Boolean(parsed.adult))}`)
          .then((r) => r.ok ? r.json().catch(() => null) : null)
      );
      const searchJsons = await Promise.all(searchFetches);
      for (const sj of searchJsons) {
        if (sj && Array.isArray(sj.results)) resultsAcc.push(...sj.results);
      }
    }

    // helper to escape regex
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 3) map, dedupe by id, compute overview keyword matches and scoring, then return sorted results
    const seen = new Map<number, any>();
    const kwsNormalized = (parsed.keywords || []).map((k) => String(k || "").toLowerCase()).filter(Boolean);

    for (const m of resultsAcc) {
      if (!m || !m.id) continue;
      if (seen.has(m.id)) continue;

      const overview = (m.overview || "").toString();
      const overviewLower = overview.toLowerCase();

      // compute matched keywords from overview (single-word tokens)
      const matchedKeywords: string[] = [];
      for (const kw of kwsNormalized) {
        // match whole word or as substring if short token
        const rx = new RegExp(`\\b${escapeRegExp(kw)}\\b`, "i");
        if (rx.test(overviewLower) || overviewLower.includes(kw)) {
          matchedKeywords.push(kw);
        }
      }

      // base score components
      const voteAvg = Number(m.vote_average) || 0;
      const popularity = Number(m.popularity) || 0;
      // normalize popularity to dampen very large values
      const popScore = Math.log1p(popularity);

      // overview match boost: each matched keyword gives a fixed boost (tunable)
      const overviewBoost = matchedKeywords.length * 4;

      const combinedScore = voteAvg * 10 + popScore * 2 + overviewBoost;

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

    // sort by combined score so overview-relevant films surface higher
    mapped.sort((a, b) => (b._combinedScore || 0) - (a._combinedScore || 0));

    // optionally shuffle among items with equal/nearly-equal scores to reduce repetition
    for (let i = 0; i < mapped.length - 1; i++) {
      const a = mapped[i];
      const b = mapped[i + 1];
      if (Math.abs((a._combinedScore || 0) - (b._combinedScore || 0)) < 0.001 && Math.random() < 0.15) {
        [mapped[i], mapped[i + 1]] = [mapped[i + 1], mapped[i]];
      }
    }

    // remove internal scoring key and limit total returned to a reasonable cap (e.g., 60)
    const final = mapped.slice(0, 60).map((m) => {
      const { _combinedScore, ...out } = m;
      return out;
    });

    return final;
  } catch (err) {
    return [];
  }
}