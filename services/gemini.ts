import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const MOOD_BRIDGE: Record<string, { match: string[]; address: string[] }> = {
  Happy: { match: ["Comedy", "Family"], address: ["Drama", "Romance"] },
  Sad: { match: ["Drama", "Romance"], address: ["Comedy", "Feel-good"] },
  Romantic: { match: ["Romance", "Drama"], address: ["Comedy", "Adventure"] },
  Excited: { match: ["Action", "Adventure"], address: ["Drama", "Drama"] },
  Relaxed: { match: ["Drama", "Romance"], address: ["Comedy", "Adventure"] },
  Angry: { match: ["Action", "Crime"], address: ["Drama", "Calming"] },
  Scared: { match: ["Horror", "Thriller"], address: ["Family", "Comedy"] },
  Adventurous: { match: ["Adventure", "Fantasy"], address: ["Drama", "Romance"] },
  Mysterious: { match: ["Mystery", "Thriller"], address: ["Comedy", "Feel-good"] },
  // concise extras to help parser generalize
  Nostalgic: { match: ["Drama", "Period"], address: ["Comedy", "Family"] },
  Curious: { match: ["Documentary", "Mystery"], address: ["Comedy", "Adventure"] },
  Wholesome: { match: ["Family", "Drama"], address: ["Thriller", "Horror"] },
  Cozy: { match: ["Romance", "Drama"], address: ["Action", "Adventure"] },
  Edgy: { match: ["Crime", "Thriller"], address: ["Comedy", "Family"] },
};

// small set of short keyword hints per mood to steer single-word keywords (match vs address)
const MOOD_KEYWORD_HINTS: Record<string, { match: string[]; address: string[] }> = {
  Happy: { match: ["joy","uplift","laugh","warm"], address: ["melancholy","quiet","introspect","slow"] },
  Sad: { match: ["tearjerker","melancholy","poignant","blue"], address: ["uplift","comedy","feelgood","sunny"] },
  Romantic: { match: ["love","chemistry","kiss","romance"], address: ["adventure","action","wholesome","comic"] },
  Excited: { match: ["thrill","adrenaline","fast","chase"], address: ["calm","slow","quiet","drama"] },
  Relaxed: { match: ["calm","soothing","gentle","ambient"], address: ["energetic","loud","fast","thrill"] },
  Angry: { match: ["rage","vengeance","conflict","intense"], address: ["calm","healing","forgiveness","gentle"] },
  Scared: { match: ["terror","jumpscare","dark","creepy"], address: ["wholesome","family","cozy","light"] },
  Adventurous: { match: ["quest","epic","journey","explore"], address: ["intimate","quiet","domestic","slice"] },
  Mysterious: { match: ["puzzle","twist","enigmatic","cryptic"], address: ["clear","straightforward","feelgood","funny"] },
  Nostalgic: { match: ["memory","retro","period","nostalgia"], address: ["modern","fresh","contemporary","bright"] },
  Curious: { match: ["discover","explore","inquire","investigate"], address: ["relax","escape","fantasy","romance"] },
  Wholesome: { match: ["gentle","heartwarming","uplift","family"], address: ["dark","gritty","thriller","horror"] },
  Cozy: { match: ["warm","comfort","snug","slow"], address: ["adrenaline","epic","action","thrill"] },
  Edgy: { match: ["gritty","raw","provocative","noir"], address: ["cheerful","light","comedy","wholesome"] },
};

// +++ NEW: lightweight tone → mood inference to guide hints when user didn't pick a mood +++
const TEXT_TONE_TO_MOOD: Array<{ key: string; mood: keyof typeof MOOD_BRIDGE }> = [
  { key: "sad", mood: "Sad" },
  { key: "down", mood: "Sad" },
  { key: "blue", mood: "Sad" },
  { key: "depressed", mood: "Sad" },
  { key: "angry", mood: "Angry" },
  { key: "mad", mood: "Angry" },
  { key: "frustrated", mood: "Angry" },
  { key: "furious", mood: "Angry" },
  { key: "scared", mood: "Scared" },
  { key: "afraid", mood: "Scared" },
  { key: "anxious", mood: "Scared" },
  { key: "tense", mood: "Scared" },
  { key: "excited", mood: "Excited" },
  { key: "thrilled", mood: "Excited" },
  { key: "pumped", mood: "Excited" },
  { key: "happy", mood: "Happy" },
  { key: "joyful", mood: "Happy" },
  { key: "cheerful", mood: "Happy" },
  { key: "relaxed", mood: "Relaxed" },
  { key: "calm", mood: "Relaxed" },
  { key: "chill", mood: "Relaxed" },
  { key: "nostalgic", mood: "Nostalgic" },
  { key: "romantic", mood: "Romantic" },
  { key: "in love", mood: "Romantic" },
  { key: "cozy", mood: "Cozy" },
  { key: "wholesome", mood: "Wholesome" },
  { key: "curious", mood: "Curious" },
  { key: "adventurous", mood: "Adventurous" },
  { key: "mysterious", mood: "Mysterious" },
  { key: "edgy", mood: "Edgy" },
];

function inferMoodFromText(text: string): keyof typeof MOOD_BRIDGE | undefined {
  const t = (text || "").toLowerCase();
  // prefer the first match in order (rough heuristic)
  for (const { key, mood } of TEXT_TONE_TO_MOOD) {
    if (t.includes(key)) return mood;
  }
  return undefined;
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  let candidate = (fenced ? fenced[1] : text).trim();

  const grabBalanced = (s: string, open: "{" | "[", close: "}" | "]") => {
    const start = s.indexOf(open);
    if (start < 0) return null;
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      if (s[i] === open) depth++;
      else if (s[i] === close) {
        depth--;
        if (depth === 0) return s.slice(start, i + 1);
      }
    }
    return null;
  };

  let jsonish =
    grabBalanced(candidate, "{", "}") ??
    grabBalanced(candidate, "[", "]") ??
    candidate;

  // Try direct parse first
  try {
    return JSON.parse(jsonish);
  } catch {
    // Tolerant cleaning heuristics (handle common LLM output variants)
    let cleaned = jsonish
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      // remove trailing commas before ] or }
      .replace(/,\s*([}\]])/g, "$1");

    // Convert Python-like booleans/null to JSON booleans/null
    cleaned = cleaned.replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\bNone\b/g, "null");

    // Replace single-quoted strings -> double quotes (simple heuristic)
    cleaned = cleaned.replace(/'([^']*)'/g, (_m, g1) => `"${g1.replace(/"/g, '\\"')}"`);

    // Ensure object keys are quoted: foo: -> "foo":
    // (only for obvious unquoted keys — conservative)
    cleaned = cleaned.replace(/([{,]\s*)([A-Za-z0-9_+-]+)\s*:/g, (_m, p1, key) => `${p1}"${key}":`);

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // Last-ditch attempt: try to find a balanced JSON substring and parse that
      const tryBalanced = grabBalanced(cleaned, "{", "}") ?? grabBalanced(cleaned, "[", "]");
      if (tryBalanced) return JSON.parse(tryBalanced);
      throw e;
    }
  }
}

export async function parseContents(prompt: string, schema?: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      // Increase stochasticity and sampling to avoid identical outputs for identical inputs.
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
      ...(schema ? { responseSchema: schema } : {}),
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    return extractJson(text);
  }
}

// small helper used after parsing to introduce minor non-deterministic ordering
function maybeShuffleArray<T>(arr?: T[]) {
  if (!Array.isArray(arr) || arr.length < 2) return arr;
  // small chance to swap two elements to avoid identical ordering on repeated prompts
  if (Math.random() < 0.5) {
    const i = Math.floor(Math.random() * arr.length);
    let j = Math.floor(Math.random() * arr.length);
    if (j === i) j = (i + 1) % arr.length;
    const copy = arr.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  }
  return arr;
}

function coerceToStringArray(arr: any): string[] | undefined {
  // Accept a few common shapes: array, comma-separated string, single string
  if (Array.isArray(arr)) {
    return arr
      .map((v) => {
        if (typeof v === "string") return v.trim();
        if (v && typeof v === "object") return (v.name || v.label || String(v)).toString().trim();
        return String(v).trim();
      })
      .filter(Boolean);
  }
  if (typeof arr === "string") {
    // split on commas, semicolons or pipe, but preserve short multi-word phrases
    return arr
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

// normalize any keyword inputs to single-word tokens suitable for overview lookup
function normalizeKeywordsToSingleWords(inputs: string[] = [], textFallback = "", limit = 8): string[] {
  const stop = new Set([
    "the","and","for","with","that","this","from","want","looking","watch","movie","movies",
    "like","a","to","of","in","on","is","it","me","i","we","you","she","he","they","be","been",
    "at","by","an","as","but","or","so","if","when","while","which","who","what","where","how",
    "stay","keep","remain","wantto","wanna","please"
  ]);
  const out = new Set<string>();

  // seed from explicit inputs first (split multi-word into individual words)
  for (const v of inputs) {
    if (!v) continue;
    for (const part of v.split(/[\s\-_/,.]+/)) {
      const w = part.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
      if (!w || w.length < 3) continue;
      if (stop.has(w)) continue;
      out.add(w);
      if (out.size >= limit) return Array.from(out);
    }
  }

  // fallback: extract from the full user text (single words)
  if (out.size < limit && textFallback) {
    const norm = textFallback
      .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
      .replace(/['-]/g, " ")
      .toLowerCase();
    const tokens = norm.split(/\s+/).filter(Boolean);
    const freq: Record<string, number> = {};
    for (const t of tokens) {
      if (t.length < 3) continue;
      if (stop.has(t)) continue;
      freq[t] = (freq[t] || 0) + 1;
    }
    const ordered = Object.entries(freq).sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    for (const w of ordered) {
      out.add(w);
      if (out.size >= limit) break;
    }
  }

  return Array.from(out).slice(0, limit);
}

// detect if user explicitly asks to remain in the given mood (so we shouldn't override)
function explicitKeepMood(text: string, mood?: string) {
  if (!mood) return false;
  const m = mood.toLowerCase();
  const r = new RegExp(`\\b(?:stay|keep|remain|want to be|want to stay|prefer to be)\\b[\\s\\w]{0,20}\\b${m}\\b`, "i");
  return r.test(text);
}

// small heuristic mapping from keywords -> genres when mood/genres absent
function inferGenresFromKeywords(keywords: string[] = []): string[] {
  const mapHits: Record<string, string> = {
    sci: "Science Fiction",
    "sci-fi": "Science Fiction",
    space: "Science Fiction",
    robot: "Science Fiction",
    romance: "Romance",
    love: "Romance",
    romcom: "Comedy",
    funny: "Comedy",
    comedy: "Comedy",
    horror: "Horror",
    scary: "Horror",
    thriller: "Thriller",
    mystery: "Mystery",
    detective: "Mystery",
    crime: "Crime",
    heist: "Crime",
    war: "War",
    history: "History",
    period: "Drama",
    biopic: "Drama",
    documentary: "Documentary",
    doc: "Documentary",
    animation: "Animation",
    cartoon: "Animation",
    kids: "Family",
    family: "Family",
    music: "Music",
    musical: "Music",
    fantasy: "Fantasy",
    magic: "Fantasy",
    adventure: "Adventure",
    epic: "Adventure",
    indie: "Drama",
    "feel-good": "Comedy",
    uplifting: "Comedy",
  };

  const out: string[] = [];
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    for (const token in mapHits) {
      if (k.includes(token) && !out.includes(mapHits[token])) {
        out.push(mapHits[token]);
      }
    }
    if (out.length >= 3) break;
  }
  return out;
}

export async function parseUserInput(text: string, mood?: string, moodResponse: "match" | "address" = "match") {
  const safeText = (text || "").trim();
  // include a compact mood->genre hint table to steer the parser without hardcoding outputs
  const compactGuide = JSON.stringify(MOOD_BRIDGE);

  const prompt = `Extract precise, input-anchored movie search parameters from the user input. Respond with JSON only that matches the schema.
InputText: """${safeText.replace(/"""|```/g, "'")}"""
Mood: "${mood ?? ""}"
MoodResponse: "${moodResponse}"

ReferenceMoodGuide: ${compactGuide}

Rules:
- If Mood is empty, ignore mood alignment unless you can infer a tone from InputText.
- If MoodResponse is "address" with no Mood, interpret "address" as counterbalancing the emotional tone detectable in InputText (e.g., if text feels sad, suggest uplifting genres); otherwise pick broadly mood-elevating/complementary options.
- Always prioritize exact words/short phrases from InputText for keywords (1–6 words). Do not invent long keywords.
- Genres are canonical labels (e.g., "Drama", "Comedy"); keywords capture user anchors.
- If the InputText is too vague or non-descriptive (short filler words, single-word affirmative replies, or otherwise lacking specific anchors), set "ambiguous": true in the JSON and return minimal/empty arrays for genres/keywords. Do not rely on a fixed built-in list of ambiguous tokens; decide ambiguity based on the informativeness of the input.
- Keep output minimal and valid. Arrays small (keywords 1–6, genres 0–4) with minor non-deterministic ordering.

Output only JSON with keys: genres, keywords, tempo, runtime_min, runtime_max, era, language, adult, moodResponse, ambiguous. No other keys.
`;

  const schema = {
    type: "object",
    properties: {
      genres: { type: "array", items: { type: "string" } },
      keywords: { type: "array", items: { type: "string" } },
      tempo: { type: "string", enum: ["slow", "medium", "fast"] },
      runtime_min: { type: "number" },
      runtime_max: { type: "number" },
      era: {
        type: "object",
        properties: {
          from: { type: "number" },
          to: { type: "number" },
        },
      },
      language: { type: ["string", "null"] },
      adult: { type: "boolean" },
      moodResponse: { type: "string", enum: ["match", "address"] },
      ambiguous: { type: "boolean" },
    },
    additionalProperties: false,
  };

  let parsed: any = null;
  try {
    // Primary attempt: requested schema (strict)
    parsed = await parseContents(prompt, schema);
  } catch (errStrict) {
    // Fallback: ask the model again without a strict responseSchema and be tolerant in parsing/coercion.
    try {
      parsed = await parseContents(prompt);
    } catch (errLoose) {
      // If both fail, return a minimal heuristic parse so callers keep working.
      parsed = { moodResponse: moodResponse === "address" ? "address" : "match", ambiguous: false };
    }
  }

  // ensure parsed is an object
  parsed = parsed && typeof parsed === "object" ? parsed : { moodResponse: moodResponse === "address" ? "address" : "match", ambiguous: false };

  // +++ CHANGE: force the user's requested moodResponse to be respected +++
  const requestedMoodResponse = moodResponse === "address" ? "address" : "match";
  parsed.moodResponse = requestedMoodResponse;

  // Coerce ambiguous to boolean if present; default false
  parsed.ambiguous = Boolean(parsed.ambiguous === true);

  const genresArr = coerceToStringArray(parsed.genres);
  const keywordsArr = coerceToStringArray(parsed.keywords);

  let singleKeywords = normalizeKeywordsToSingleWords(keywordsArr || [], safeText, 8);

  if (!singleKeywords || singleKeywords.length === 0) {
    singleKeywords = extractKeywordsFromText(safeText, 8);
  }

  // +++ NEW: infer mood from text if user didn't provide one +++
  const inferredMood = mood ? undefined : inferMoodFromText(safeText);
  const moodForHints = mood || inferredMood;

  const keepMood = explicitKeepMood(safeText, mood);

  // If the model marked the input ambiguous, clear keywords/genres to signal caller to ask for clarification
  if (parsed.ambiguous) {
    parsed.keywords = [];
    parsed.genres = [];
    // still preserve moodResponse and adult flags, but avoid injecting hint tokens
    parsed.moodResponse = requestedMoodResponse;
    return parsed;
  }

  if (moodForHints && !keepMood) {
    const moodKey = Object.keys(MOOD_KEYWORD_HINTS).find((k) => k.toLowerCase() === moodForHints.toLowerCase());
    const hints = moodKey ? MOOD_KEYWORD_HINTS[moodKey] : null;

    if (parsed.moodResponse === "match" && hints?.match?.length) {
      const need = 2; // at most 2 hint tokens
      const present = new Set(singleKeywords.map((s) => s.toLowerCase()));
      for (const h of hints.match) {
        if (present.has(h)) continue;
        singleKeywords.unshift(h);
        present.add(h);
        if (present.size >= need + singleKeywords.length) break;
      }
    } else if (parsed.moodResponse === "address" && hints?.address?.length) {
      const moodLower = (moodForHints || "").toLowerCase();
      singleKeywords = singleKeywords.filter((k) => k.toLowerCase() !== moodLower);
      for (const h of hints.address) {
        if (!singleKeywords.includes(h)) singleKeywords.unshift(h);
        if (singleKeywords.length >= 8) break;
      }
    }
  }

  // finalize keywords: ensure single words, dedupe, limit, shuffle small chance
  const finalKeywords = Array.from(new Set(singleKeywords.map((k) => (k || "").toLowerCase())))
    .filter(Boolean)
    .slice(0, 8);
  parsed.keywords = maybeShuffleArray(finalKeywords);

  // Ensure genres ALWAYS present as an array (may be empty) — prefer model, then mood hints, then keyword heuristics
  let finalGenres: string[] = [];
  if (Array.isArray(genresArr) && genresArr.length > 0) {
    finalGenres = genresArr.slice(0, 4).map((g) => (g || "").trim()).filter(Boolean);
  } else if (moodForHints) {
    const hint = MOOD_BRIDGE[moodForHints];
    if (hint) {
      const pick = parsed.moodResponse === "address" ? hint.address : hint.match;
      finalGenres = (pick || []).slice(0, 4);
    }
  }

  // If still empty, try simple inference from keywords
  if (finalGenres.length === 0) {
    const inferred = inferGenresFromKeywords(parsed.keywords || []);
    finalGenres = inferred.slice(0, 3);
  }

  // Always dedupe and limit
  parsed.genres = Array.from(new Set(finalGenres)).slice(0, 4);
  parsed.genres = maybeShuffleArray(parsed.genres);

  // Coerce adult to boolean if present (handle "False", "false", "no", 0, "0", etc.)
  if ("adult" in parsed) {
    const v = parsed.adult;
    if (typeof v === "boolean") {
      // ok
    } else if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      parsed.adult = ["true", "yes", "y", "1"].includes(s);
    } else if (typeof v === "number") {
      parsed.adult = Boolean(v);
    } else {
      delete parsed.adult;
    }
  }

  // Safety: if moodResponse === "address" and the model returned genres that are exact synonyms of the Mood label,
  // prefer to remove direct synonyms so the result better counteracts the mood.
  if (parsed.moodResponse === "address" && Array.isArray(parsed.genres)) {
    const moodLower = (moodForHints || "").toLowerCase();
    parsed.genres = (parsed.genres as string[]).filter((g) => g.toLowerCase() !== moodLower);
    parsed.genres = parsed.genres || [];
  }

  return parsed;
}

// Inserted: robust fallback that extracts single-word tokens from the full user text.
// This implementation was referenced elsewhere and was missing, causing a TS2304 error.
function extractKeywordsFromText(text: string, limit = 8): string[] {
  if (!text) return [];

  const normalize = (s: string) =>
    s
      .replace(/[“”«»„”]/g, '"')
      .replace(/[–—‑]/g, "-")
      .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const src = normalize(text);

  const out = new Set<string>();

  const stop = new Set([
    "the","and","for","with","that","this","from","want","looking","watch","movie","movies",
    "like","a","to","of","in","on","is","it","me","i","we","you","she","he","they","be","been",
    "at","by","an","as","but","or","so","if","when","while","which","who","what","where","how",
    "stay","keep","remain","wantto","wanna","please"
  ]);
  const EMOTIONS = [
    "happy","sad","angry","scared","excited","nostalgic","melancholic","anxious",
    "relaxed","lonely","hopeful","joyful","bored","curious","wholesome","cozy",
    "edgy","romantic","surreal","inspired","playful","motivated","frustrated",
    "heartbroken","calm","tense","suspenseful"
  ];
  const SITUATIONS = [
    "breakup","revenge","heist","investigation","escape","journey","roadtrip","quest",
    "friendship","family","school","college","work","prison","war","battle",
    "survival","apocalypse","zombie","alien","superhero","spy","detective"
  ];
  const SETTINGS = [
    "beach","city","forest","mountain","village","suburb","space","ocean","desert",
    "island","castle","hospital","school","bar","club","stadium"
  ];
  const TIMES = ["past","present","future","modern","period","retro","medieval","victorian","noir"];

  const pushToken = (w?: string) => {
    if (!w) return;
    const clean = w.toLowerCase().replace(/['-]/g, " ").split(/\s+/)[0] ?? "";
    if (!clean || clean.length < 3) return;
    if (stop.has(clean)) return;
    out.add(clean);
  };

  // 1) quoted phrases -> words
  for (const m of Array.from(text.matchAll(/"([^"]{2,80})"|'([^']{2,80})'/g))) {
    const phrase = (m[1] || m[2] || "").trim();
    if (!phrase) continue;
    for (const w of phrase.split(/\s+/)) pushToken(w);
    if (out.size >= limit) break;
  }
  if (out.size >= limit) return Array.from(out).slice(0, limit);

  // 2) years/decades
  for (const m of Array.from(text.matchAll(/\b(1[89]\d{2}|20\d{2})\b/g))) pushToken(m[1]);
  for (const m of Array.from(text.matchAll(/\b(\d{2}0s|\d0s|60s|70s|80s|90s)\b/gi))) pushToken(m[1]);
  if (out.size >= limit) return Array.from(out).slice(0, limit);

  const joined = ` ${src.toLowerCase()} `;
  for (const e of EMOTIONS) if (joined.includes(` ${e} `)) pushToken(e);
  for (const s of SITUATIONS) if (joined.includes(` ${s} `)) pushToken(s);
  for (const s of SETTINGS) if (joined.includes(` ${s} `)) pushToken(s);
  for (const t of TIMES) if (joined.includes(` ${t} `)) pushToken(t);
  if (out.size >= limit) return Array.from(out).slice(0, limit);

  // 3) proper nouns (capitalized)
  for (const m of Array.from(text.matchAll(/\b([A-Z][a-z]{2,})\b/g))) {
    pushToken(m[1]);
    if (out.size >= limit) break;
  }
  if (out.size >= limit) return Array.from(out).slice(0, limit);

  // 4) frequency-based content words
  const tokens = src
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && t.length > 2 && !stop.has(t));
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const freqCandidates = Object.entries(freq).sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  for (const c of freqCandidates) {
    pushToken(c);
    if (out.size >= limit) break;
  }

  // 5) final fallback: split full text
  if (out.size === 0) {
    for (const w of tokens) {
      pushToken(w);
      if (out.size >= limit) break;
    }
  }

  return Array.from(out).slice(0, limit);
}