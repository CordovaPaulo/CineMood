import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const MOOD_BRIDGE: Record<string, { match: string[]; address: string[] }> = {
  Happy: { 
    match: ["Comedy", "Family", "Animation", "Musical", "Adventure"], 
    address: ["Drama", "Romance", "Documentary", "History", "War"] 
  },
  Sad: { 
    match: ["Drama", "Romance", "War", "History", "Music"], 
    address: ["Comedy", "Family", "Animation", "Adventure", "Fantasy"] 
  },
  Romantic: { 
    match: ["Romance", "Drama", "Musical", "Comedy"], 
    address: ["Action", "Adventure", "Thriller", "Science Fiction", "Horror"] 
  },
  Excited: { 
    match: ["Action", "Adventure", "Thriller", "Science Fiction", "Fantasy"], 
    address: ["Drama", "Romance", "Documentary", "History"] 
  },
  Relaxed: { 
    match: ["Drama", "Romance", "Documentary", "Music", "Animation"], 
    address: ["Action", "Comedy", "Adventure", "Thriller", "Horror"] 
  },
  Angry: { 
    match: ["Action", "Crime", "Thriller", "War", "Horror"], 
    address: ["Comedy", "Drama", "Family", "Romance", "Animation"] 
  },
  Scared: { 
    match: ["Horror", "Thriller", "Mystery", "Crime"], 
    address: ["Family", "Comedy", "Animation", "Romance", "Adventure"] 
  },
  Adventurous: { 
    match: ["Adventure", "Fantasy", "Action", "Science Fiction", "Western"], 
    address: ["Drama", "Romance", "Documentary", "History"] 
  },
  Mysterious: { 
    match: ["Mystery", "Thriller", "Crime", "Science Fiction", "Horror"], 
    address: ["Comedy", "Family", "Romance", "Animation"] 
  },
  Nostalgic: { 
    match: ["Drama", "History", "War", "Western", "Music"], 
    address: ["Comedy", "Family", "Science Fiction", "Fantasy"] 
  },
  Curious: { 
    match: ["Documentary", "Mystery", "Science Fiction", "History", "Thriller"], 
    address: ["Comedy", "Adventure", "Fantasy", "Romance"] 
  },
  Wholesome: { 
    match: ["Family", "Animation", "Drama", "Comedy", "Fantasy"], 
    address: ["Thriller", "Horror", "Crime", "War", "Action"] 
  },
  Cozy: { 
    match: ["Romance", "Drama", "Comedy", "Family", "Animation"], 
    address: ["Action", "Adventure", "Horror", "Thriller", "War"] 
  },
  Edgy: { 
    match: ["Crime", "Thriller", "Horror", "War", "Mystery"], 
    address: ["Comedy", "Family", "Animation", "Musical", "Romance"] 
  },
  Bored: { 
    match: ["Action", "Adventure", "Comedy", "Thriller", "Science Fiction"], 
    address: ["Drama", "Documentary", "Romance", "History"] 
  },
  Motivated: { 
    match: ["Drama", "Documentary", "Action", "Adventure", "History"], 
    address: ["Horror", "Thriller", "Romance", "Comedy"] 
  },
  Lonely: { 
    match: ["Romance", "Drama", "Comedy", "Family"], 
    address: ["Action", "Adventure", "Horror", "Thriller"] 
  },
  Hopeful: { 
    match: ["Drama", "Family", "Animation", "Fantasy", "Adventure"], 
    address: ["Horror", "Thriller", "Crime", "War"] 
  },
  Melancholic: { 
    match: ["Drama", "Romance", "War", "History", "Music"], 
    address: ["Comedy", "Animation", "Family", "Adventure", "Fantasy"] 
  },
  Playful: { 
    match: ["Comedy", "Animation", "Family", "Adventure", "Fantasy"], 
    address: ["Drama", "Horror", "Thriller", "War", "Crime"] 
  },
};

// Public helper: get canonical genres for a mood and response type
export function getGenresForMood(mood?: string, response: "match" | "address" = "match") {
  if (!mood) return [];
  const key = Object.keys(MOOD_BRIDGE).find((k) => k.toLowerCase() === mood.toLowerCase());
  if (!key) return [];
  const pick = MOOD_BRIDGE[key];
  if (!pick) return [];
  const arr = response === "address" ? pick.address : pick.match;
  return Array.isArray(arr) ? arr.slice(0, 4) : [];
}

// Expanded keyword hints with more nuanced suggestions
const MOOD_KEYWORD_HINTS: Record<string, { match: string[]; address: string[] }> = {
  Happy: { 
    match: [
      "joy", "uplift", "laugh", "warm", "cheerful", "bright", "sunny", "delight", 
      "celebration", "fun", "smile", "lighthearted", "positive", "merry", "gleeful",
      "jubilant", "festive", "buoyant", "radiant", "bliss"
    ], 
    address: [
      "melancholy", "quiet", "introspect", "slow", "somber", "reflective", "serious", 
      "contemplative", "pensive", "subdued", "muted", "thoughtful", "solemn", "grave",
      "profound", "deep", "heavy"
    ] 
  },
  Sad: { 
    match: [
      "tearjerker", "melancholy", "poignant", "blue", "grief", "loss", "heartbreak", 
      "emotional", "moving", "bittersweet", "sorrow", "weep", "cry", "tragic", "mournful",
      "devastating", "painful", "anguish", "longing", "yearning", "despair"
    ], 
    address: [
      "uplift", "comedy", "feelgood", "sunny", "cheerful", "light", "hopeful", "inspiring", 
      "joyful", "bright", "optimistic", "heartwarming", "encouraging", "positive", "happy",
      "spirited", "vivacious", "lively"
    ] 
  },
  Romantic: { 
    match: [
      "love", "chemistry", "kiss", "romance", "passion", "relationship", "intimate", 
      "tender", "soulmate", "heartfelt", "affection", "desire", "devotion", "adore",
      "sweetheart", "amour", "courtship", "embrace", "Valentine", "couple", "dating"
    ], 
    address: [
      "adventure", "action", "wholesome", "comic", "friendship", "independent", "solo", 
      "platonic", "career", "ambition", "thriller", "suspense", "mystery", "discovery",
      "exploration", "journey"
    ] 
  },
  Excited: { 
    match: [
      "thrill", "adrenaline", "fast", "chase", "explosive", "intense", "dynamic", 
      "energetic", "rush", "pulse", "electrifying", "exhilarating", "pumped", "hyper",
      "kinetic", "frantic", "turbulent", "wild", "fierce", "vigorous", "powerful"
    ], 
    address: [
      "calm", "slow", "quiet", "drama", "peaceful", "gentle", "meditative", "subdued",
      "tranquil", "serene", "soothing", "relaxed", "mellow", "soft", "easy", "subtle",
      "contemplative", "restful"
    ] 
  },
  Relaxed: { 
    match: [
      "calm", "soothing", "gentle", "ambient", "peaceful", "serene", "tranquil", 
      "mellow", "soft", "easy", "laid-back", "unwind", "chill", "zen", "placid",
      "restful", "comfortable", "cozy", "leisurely", "easygoing", "unhurried"
    ], 
    address: [
      "energetic", "loud", "fast", "thrill", "intense", "chaotic", "explosive", "dynamic",
      "frenetic", "hectic", "wild", "turbulent", "aggressive", "forceful", "powerful",
      "vigorous", "exciting"
    ] 
  },
  Angry: { 
    match: [
      "rage", "vengeance", "conflict", "intense", "fury", "justice", "retribution", 
      "confrontation", "rebellion", "fight", "wrathful", "hostile", "aggressive", "fierce",
      "violent", "brutal", "savage", "ruthless", "defiant", "revolt", "uprising"
    ], 
    address: [
      "calm", "healing", "forgiveness", "gentle", "peaceful", "understanding", 
      "reconciliation", "harmony", "empathy", "compassion", "kindness", "patience",
      "serenity", "tranquil", "soothing", "therapeutic", "restorative"
    ] 
  },
  Scared: { 
    match: [
      "terror", "jumpscare", "dark", "creepy", "suspense", "eerie", "haunting", 
      "nightmare", "dread", "spine", "chilling", "sinister", "ominous", "macabre",
      "horrifying", "frightening", "spooky", "unsettling", "disturbing", "menacing", "ghastly"
    ], 
    address: [
      "wholesome", "family", "cozy", "light", "cheerful", "safe", "comforting", "uplifting",
      "reassuring", "warm", "gentle", "pleasant", "delightful", "joyful", "bright",
      "sunny", "happy", "peaceful"
    ] 
  },
  Adventurous: { 
    match: [
      "quest", "epic", "journey", "explore", "discovery", "expedition", "treasure", 
      "voyage", "odyssey", "frontier", "pioneer", "wanderlust", "explorer", "safari",
      "trail", "wilderness", "uncharted", "daring", "bold", "heroic", "legendary"
    ], 
    address: [
      "intimate", "quiet", "domestic", "slice", "simple", "mundane", "routine", "familiar",
      "ordinary", "everyday", "homely", "settled", "local", "neighborhood", "suburban",
      "comfortable", "predictable"
    ] 
  },
  Mysterious: { 
    match: [
      "puzzle", "twist", "enigmatic", "cryptic", "detective", "clue", "whodunit", 
      "conspiracy", "secret", "riddle", "intrigue", "obscure", "shadowy", "covert",
      "hidden", "unknown", "cipher", "enigma", "labyrinth", "maze", "suspense"
    ], 
    address: [
      "clear", "straightforward", "feelgood", "funny", "obvious", "simple", "transparent", 
      "lighthearted", "open", "direct", "uncomplicated", "plain", "evident", "apparent",
      "explicit", "frank", "honest"
    ] 
  },
  Nostalgic: { 
    match: [
      "memory", "retro", "period", "nostalgia", "vintage", "throwback", "childhood", 
      "classic", "timeless", "tradition", "heritage", "bygone", "yesteryear", "old-fashioned",
      "reminisce", "sentimental", "wistful", "antiquated", "golden age", "historical", "legacy"
    ], 
    address: [
      "modern", "fresh", "contemporary", "bright", "futuristic", "innovative", "current", 
      "trendy", "new", "cutting-edge", "avant-garde", "progressive", "forward-thinking",
      "state-of-the-art", "latest", "now"
    ] 
  },
  Curious: { 
    match: [
      "discover", "explore", "inquire", "investigate", "learn", "reveal", "uncover", 
      "examine", "study", "research", "probe", "quest", "search", "analyze", "scrutinize",
      "delve", "excavate", "intellectual", "scientific", "academic", "educational"
    ], 
    address: [
      "relax", "escape", "fantasy", "romance", "simple", "familiar", "predictable", 
      "comfortable", "entertainment", "leisure", "fun", "casual", "lighthearted",
      "effortless", "undemanding", "accessible"
    ] 
  },
  Wholesome: { 
    match: [
      "gentle", "heartwarming", "uplift", "family", "pure", "innocent", "kind", 
      "goodness", "caring", "sweet", "tender", "nurturing", "compassionate", "loving",
      "benevolent", "altruistic", "virtuous", "noble", "sincere", "genuine", "authentic"
    ], 
    address: [
      "dark", "gritty", "thriller", "horror", "violent", "intense", "edgy", "provocative",
      "harsh", "brutal", "raw", "cynical", "bleak", "disturbing", "controversial",
      "shocking", "graphic"
    ] 
  },
  Cozy: { 
    match: [
      "warm", "comfort", "snug", "slow", "intimate", "homey", "safe", "relaxing", 
      "soft", "gentle", "peaceful", "cocooning", "nest", "blanket", "fireplace",
      "cuddle", "snuggle", "sheltered", "protected", "secure", "inviting"
    ], 
    address: [
      "adrenaline", "epic", "action", "thrill", "explosive", "grand", "intense", "chaotic",
      "sweeping", "spectacular", "massive", "overwhelming", "dramatic", "extreme",
      "turbulent", "fierce", "powerful"
    ] 
  },
  Edgy: { 
    match: [
      "gritty", "raw", "provocative", "noir", "dark", "controversial", "bold", "daring", 
      "subversive", "rebel", "unconventional", "radical", "avant-garde", "transgressive",
      "underground", "countercultural", "anarchic", "defiant", "audacious", "shocking"
    ], 
    address: [
      "cheerful", "light", "comedy", "wholesome", "innocent", "safe", "conventional", 
      "mainstream", "traditional", "family-friendly", "pleasant", "polite", "proper",
      "respectable", "clean", "sanitized"
    ] 
  },
  Bored: { 
    match: [
      "exciting", "engaging", "captivating", "dynamic", "stimulating", "gripping", 
      "riveting", "unpredictable", "thrilling", "absorbing", "compelling", "mesmerizing",
      "fascinating", "enthralling", "spellbinding", "addictive", "page-turner", "edge-of-seat"
    ], 
    address: [
      "slow", "quiet", "contemplative", "meditative", "subtle", "minimalist", "gentle",
      "understated", "nuanced", "reflective", "introspective", "philosophical", "cerebral",
      "artistic", "poetic"
    ] 
  },
  Motivated: { 
    match: [
      "inspiring", "triumph", "achievement", "determination", "success", "perseverance", 
      "overcome", "resilience", "victory", "champion", "hero", "ambitious", "driven",
      "goal", "pursuit", "struggle", "comeback", "underdog", "transformation", "growth"
    ], 
    address: [
      "relaxing", "escapist", "fantastical", "dreamy", "whimsical", "lighthearted",
      "carefree", "leisurely", "indulgent", "pleasurable", "entertaining", "amusing",
      "diverting", "recreational"
    ] 
  },
  Lonely: { 
    match: [
      "connection", "companionship", "friendship", "together", "bond", "relationship", 
      "warmth", "belonging", "community", "family", "unite", "reunion", "solidarity",
      "kinship", "fellowship", "alliance", "partnership", "togetherness", "camaraderie"
    ], 
    address: [
      "solitude", "independence", "self", "solo", "isolation", "introspective", "alone",
      "individual", "autonomous", "self-reliant", "self-sufficient", "hermit", "recluse",
      "detached", "separate"
    ] 
  },
  Hopeful: { 
    match: [
      "optimistic", "uplifting", "inspiring", "bright", "renewal", "redemption", "promise", 
      "possibility", "faith", "belief", "aspiration", "dream", "vision", "future",
      "potential", "opportunity", "chance", "new beginning", "rebirth", "revival"
    ], 
    address: [
      "cynical", "dark", "pessimistic", "bleak", "harsh", "grim", "despairing", "hopeless",
      "nihilistic", "fatalistic", "dystopian", "apocalyptic", "tragic", "dire", "somber"
    ] 
  },
  Melancholic: { 
    match: [
      "wistful", "yearning", "longing", "bittersweet", "reflective", "pensive", "somber", 
      "mournful", "elegiac", "plaintive", "nostalgic", "saudade", "doleful", "rueful",
      "regretful", "forlorn", "sorrowful", "blue", "contemplative", "introspective"
    ], 
    address: [
      "upbeat", "energetic", "vibrant", "lively", "cheerful", "spirited", "dynamic",
      "exuberant", "buoyant", "vivacious", "animated", "effervescent", "peppy", "zippy",
      "bouncy", "bright", "sunny"
    ] 
  },
  Playful: { 
    match: [
      "fun", "whimsical", "silly", "quirky", "imaginative", "creative", "colorful", 
      "lighthearted", "amusing", "mischievous", "cheeky", "frisky", "jovial", "jocular",
      "witty", "humorous", "entertaining", "delightful", "fanciful", "fantastical", "zany"
    ], 
    address: [
      "serious", "somber", "heavy", "intense", "grim", "dramatic", "weighty", "grave",
      "profound", "consequential", "substantial", "meaningful", "significant", "important",
      "critical", "urgent"
    ] 
  },
};

// Expanded text-to-mood inference with more coverage
const TEXT_TONE_TO_MOOD: Array<{ key: string; mood: keyof typeof MOOD_BRIDGE }> = [
  // Sadness spectrum (expanded)
  { key: "sad", mood: "Sad" },
  { key: "down", mood: "Sad" },
  { key: "blue", mood: "Sad" },
  { key: "depressed", mood: "Sad" },
  { key: "heartbroken", mood: "Sad" },
  { key: "grief", mood: "Sad" },
  { key: "mourning", mood: "Sad" },
  { key: "sorrowful", mood: "Sad" },
  { key: "devastated", mood: "Sad" },
  { key: "miserable", mood: "Sad" },
  { key: "dejected", mood: "Sad" },
  { key: "despondent", mood: "Sad" },
  { key: "melancholic", mood: "Melancholic" },
  { key: "melancholy", mood: "Melancholic" },
  { key: "wistful", mood: "Melancholic" },
  { key: "bittersweet", mood: "Melancholic" },
  { key: "nostalgic", mood: "Nostalgic" },
  { key: "pensive", mood: "Melancholic" },
  { key: "reflective", mood: "Melancholic" },
  { key: "contemplative", mood: "Melancholic" },
  
  // Anger spectrum (expanded)
  { key: "angry", mood: "Angry" },
  { key: "mad", mood: "Angry" },
  { key: "frustrated", mood: "Angry" },
  { key: "furious", mood: "Angry" },
  { key: "rage", mood: "Angry" },
  { key: "annoyed", mood: "Angry" },
  { key: "irritated", mood: "Angry" },
  { key: "pissed", mood: "Angry" },
  { key: "outraged", mood: "Angry" },
  { key: "hostile", mood: "Angry" },
  { key: "bitter", mood: "Angry" },
  { key: "resentful", mood: "Angry" },
  { key: "vengeful", mood: "Angry" },
  
  // Fear spectrum (expanded)
  { key: "scared", mood: "Scared" },
  { key: "afraid", mood: "Scared" },
  { key: "anxious", mood: "Scared" },
  { key: "tense", mood: "Scared" },
  { key: "nervous", mood: "Scared" },
  { key: "worried", mood: "Scared" },
  { key: "terrified", mood: "Scared" },
  { key: "frightened", mood: "Scared" },
  { key: "panicked", mood: "Scared" },
  { key: "uneasy", mood: "Scared" },
  { key: "apprehensive", mood: "Scared" },
  { key: "paranoid", mood: "Scared" },
  
  // Joy/Excitement spectrum (expanded)
  { key: "excited", mood: "Excited" },
  { key: "thrilled", mood: "Excited" },
  { key: "pumped", mood: "Excited" },
  { key: "energized", mood: "Excited" },
  { key: "hyped", mood: "Excited" },
  { key: "enthusiastic", mood: "Excited" },
  { key: "exhilarated", mood: "Excited" },
  { key: "happy", mood: "Happy" },
  { key: "joyful", mood: "Happy" },
  { key: "cheerful", mood: "Happy" },
  { key: "delighted", mood: "Happy" },
  { key: "elated", mood: "Happy" },
  { key: "ecstatic", mood: "Happy" },
  { key: "jubilant", mood: "Happy" },
  { key: "gleeful", mood: "Happy" },
  { key: "content", mood: "Happy" },
  { key: "satisfied", mood: "Happy" },
  { key: "playful", mood: "Playful" },
  { key: "silly", mood: "Playful" },
  { key: "goofy", mood: "Playful" },
  { key: "mischievous", mood: "Playful" },
  { key: "whimsical", mood: "Playful" },
  
  // Calm spectrum (expanded)
  { key: "relaxed", mood: "Relaxed" },
  { key: "calm", mood: "Relaxed" },
  { key: "chill", mood: "Relaxed" },
  { key: "peaceful", mood: "Relaxed" },
  { key: "serene", mood: "Relaxed" },
  { key: "tranquil", mood: "Relaxed" },
  { key: "zen", mood: "Relaxed" },
  { key: "mellow", mood: "Relaxed" },
  { key: "laid-back", mood: "Relaxed" },
  { key: "cozy", mood: "Cozy" },
  { key: "comfortable", mood: "Cozy" },
  { key: "snug", mood: "Cozy" },
  { key: "cuddly", mood: "Cozy" },
  
  // Nostalgic spectrum
  { key: "nostalgic", mood: "Nostalgic" },
  { key: "reminiscing", mood: "Nostalgic" },
  { key: "throwback", mood: "Nostalgic" },
  { key: "memory", mood: "Nostalgic" },
  { key: "sentimental", mood: "Nostalgic" },
  { key: "longing", mood: "Nostalgic" },
  
  // Romantic spectrum (expanded)
  { key: "romantic", mood: "Romantic" },
  { key: "in love", mood: "Romantic" },
  { key: "loving", mood: "Romantic" },
  { key: "affectionate", mood: "Romantic" },
  { key: "passionate", mood: "Romantic" },
  { key: "intimate", mood: "Romantic" },
  { key: "tender", mood: "Romantic" },
  { key: "smitten", mood: "Romantic" },
  { key: "infatuated", mood: "Romantic" },
  
  // Other moods (expanded)
  { key: "wholesome", mood: "Wholesome" },
  { key: "heartwarming", mood: "Wholesome" },
  { key: "sweet", mood: "Wholesome" },
  { key: "pure", mood: "Wholesome" },
  { key: "innocent", mood: "Wholesome" },
  { key: "curious", mood: "Curious" },
  { key: "wondering", mood: "Curious" },
  { key: "inquisitive", mood: "Curious" },
  { key: "intrigued", mood: "Curious" },
  { key: "adventurous", mood: "Adventurous" },
  { key: "daring", mood: "Adventurous" },
  { key: "bold", mood: "Adventurous" },
  { key: "brave", mood: "Adventurous" },
  { key: "mysterious", mood: "Mysterious" },
  { key: "enigmatic", mood: "Mysterious" },
  { key: "cryptic", mood: "Mysterious" },
  { key: "intriguing", mood: "Mysterious" },
  { key: "edgy", mood: "Edgy" },
  { key: "rebellious", mood: "Edgy" },
  { key: "defiant", mood: "Edgy" },
  { key: "provocative", mood: "Edgy" },
  { key: "bored", mood: "Bored" },
  { key: "unmotivated", mood: "Bored" },
  { key: "restless", mood: "Bored" },
  { key: "listless", mood: "Bored" },
  { key: "apathetic", mood: "Bored" },
  { key: "motivated", mood: "Motivated" },
  { key: "inspired", mood: "Motivated" },
  { key: "determined", mood: "Motivated" },
  { key: "ambitious", mood: "Motivated" },
  { key: "driven", mood: "Motivated" },
  { key: "focused", mood: "Motivated" },
  { key: "lonely", mood: "Lonely" },
  { key: "isolated", mood: "Lonely" },
  { key: "alone", mood: "Lonely" },
  { key: "disconnected", mood: "Lonely" },
  { key: "lonesome", mood: "Lonely" },
  { key: "hopeful", mood: "Hopeful" },
  { key: "optimistic", mood: "Hopeful" },
  { key: "uplifted", mood: "Hopeful" },
  { key: "encouraged", mood: "Hopeful" },
  { key: "positive", mood: "Hopeful" },
];

// Enhanced mood inference with priority levels
function inferMoodFromText(text: string): keyof typeof MOOD_BRIDGE | undefined {
  const t = (text || "").toLowerCase();
  
  // Priority 1: Explicit mood statements (e.g., "I'm feeling...", "I feel...")
  const explicitPatterns = [
    /(?:i'?m|im|i am)\s+(?:feeling|in a|so|really|very|super|pretty)\s+(\w+)/i,
    /(?:i feel|feeling)\s+(?:so|really|very|super|pretty)?\s*(\w+)/i,
    /(?:my mood is|current mood|mood:|feeling:)\s+(\w+)/i,
    /(?:i'm|i am)\s+(\w+)\s+(?:right now|today|tonight|this evening)/i,
  ];
  
  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const moodWord = match[1].toLowerCase();
      const found = TEXT_TONE_TO_MOOD.find(({ key }) => key === moodWord || moodWord.includes(key));
      if (found) return found.mood;
    }
  }
  
  // Priority 2: Direct mood word matches (prefer earlier matches as more specific)
  for (const { key, mood } of TEXT_TONE_TO_MOOD) {
    // Use word boundaries for better precision
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(t)) return mood;
  }
  
  // Priority 3: Contextual inference from phrases (expanded)
  const contextualPatterns: Array<{ pattern: RegExp; mood: keyof typeof MOOD_BRIDGE }> = [
    // Sadness contexts
    { pattern: /need\s+(?:a\s+)?good\s+cry|want\s+to\s+cry|make\s+me\s+cry/i, mood: "Sad" },
    { pattern: /going\s+through\s+(?:a\s+)?breakup|just\s+broke\s+up|relationship\s+ended/i, mood: "Sad" },
    { pattern: /lost\s+(?:my|someone|a)/i, mood: "Sad" },
    { pattern: /dealing\s+with\s+grief|mourning|funeral/i, mood: "Sad" },
    
    // Happy contexts
    { pattern: /cheer\s+me\s+up|lift\s+my\s+spirits|brighten\s+my\s+day/i, mood: "Happy" },
    { pattern: /celebrate|celebrating|celebration|party|good\s+news/i, mood: "Happy" },
    { pattern: /laugh|funny|humor|comedy|joke/i, mood: "Happy" },
    
    // Relaxation contexts
    { pattern: /wind\s+down|unwind|de-stress|destress|decompress/i, mood: "Relaxed" },
    { pattern: /after\s+(?:a\s+)?long\s+(?:day|week)|tired|exhausted/i, mood: "Relaxed" },
    { pattern: /lazy\s+(?:day|evening|afternoon)|rainy\s+day/i, mood: "Cozy" },
    
    // Excitement contexts
    { pattern: /get\s+my\s+blood\s+pumping|adrenaline|action-packed/i, mood: "Excited" },
    { pattern: /edge\s+of\s+my\s+seat|intense|explosive/i, mood: "Excited" },
    
    // Fear contexts
    { pattern: /spook\s+me|scare\s+me|terrify\s+me|give\s+me\s+chills/i, mood: "Scared" },
    { pattern: /horror\s+fan|love\s+scary|thriller\s+mood/i, mood: "Scared" },
    
    // Romantic contexts
    { pattern: /date\s+night|anniversary|romantic\s+evening|valentine/i, mood: "Romantic" },
    { pattern: /love\s+story|romance|couple|relationship\s+movie/i, mood: "Romantic" },
    
    // Nostalgic contexts
    { pattern: /miss\s+the\s+(?:old|good\s+old)\s+days|reminds?\s+me\s+of|brings?\s+back/i, mood: "Nostalgic" },
    { pattern: /childhood|growing\s+up|when\s+i\s+was\s+(?:young|a\s+kid)/i, mood: "Nostalgic" },
    { pattern: /classic|vintage|retro|throwback|old\s+school/i, mood: "Nostalgic" },
    
    // Curiosity contexts
    { pattern: /something\s+deep|make\s+me\s+think|thought-provoking/i, mood: "Curious" },
    { pattern: /learn|educational|documentary|discover/i, mood: "Curious" },
    { pattern: /mystery|puzzle|detective|whodunit/i, mood: "Mysterious" },
    
    // Anger contexts
    { pattern: /blow\s+off\s+steam|vent|release\s+anger|frustrated/i, mood: "Angry" },
    { pattern: /revenge|justice|payback|get\s+back\s+at/i, mood: "Angry" },
    
    // Boredom contexts
    { pattern: /nothing\s+to\s+do|kill\s+time|pass\s+the\s+time/i, mood: "Bored" },
    { pattern: /bored\s+out\s+of\s+my\s+mind|so\s+bored|really\s+bored/i, mood: "Bored" },
    
    // Motivation contexts
    { pattern: /need\s+(?:some\s+)?inspiration|motivate\s+me|pump\s+me\s+up/i, mood: "Motivated" },
    { pattern: /underdog\s+story|comeback|triumph|overcome/i, mood: "Motivated" },
    
    // Loneliness contexts
    { pattern: /feeling\s+alone|need\s+company|miss\s+people|isolated/i, mood: "Lonely" },
    { pattern: /connection|companionship|friendship|human\s+contact/i, mood: "Lonely" },
    
    // Hope contexts
    { pattern: /need\s+hope|looking\s+for\s+hope|something\s+uplifting/i, mood: "Hopeful" },
    { pattern: /new\s+beginning|fresh\s+start|second\s+chance/i, mood: "Hopeful" },
    
    // Wholesome contexts
    { pattern: /wholesome|heartwarming|feel-good|family-friendly/i, mood: "Wholesome" },
    { pattern: /innocent|pure|sweet|gentle/i, mood: "Wholesome" },
    
    // Adventurous contexts
    { pattern: /adventure|explore|journey|quest|travel/i, mood: "Adventurous" },
    { pattern: /epic|grand|sweeping|legendary/i, mood: "Adventurous" },
  ];
  
  for (const { pattern, mood } of contextualPatterns) {
    if (pattern.test(text)) return mood;
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
  const compactGuide = JSON.stringify(MOOD_BRIDGE);

  // +++ ENHANCED: infer mood from text if none provided +++
  const inferredMood = mood ? undefined : inferMoodFromText(safeText);
  const effectiveMood = mood || inferredMood;

  const prompt = `Extract precise, input-anchored movie search parameters from the user input. Respond with JSON only that matches the schema.
InputText: """${safeText.replace(/"""|```/g, "'")}"""
Mood: "${effectiveMood ?? ""}"
MoodResponse: "${moodResponse}"

ReferenceMoodGuide: ${compactGuide}

Rules:
- If Mood is provided, use it for genre/keyword alignment.
- If Mood is empty but InputText contains emotional tone, infer the mood and set inferredMood field.
- If MoodResponse is "address" with a Mood, counterbalance it; if "address" with no Mood, detect tone and counterbalance.
- Always prioritize exact words/short phrases from InputText for keywords (1–6 words). Do not invent long keywords.
- Genres are canonical labels (e.g., "Drama", "Comedy"); keywords capture user anchors.
- If the InputText is too vague or non-descriptive (short filler words, single-word affirmative replies, or otherwise lacking specific anchors), set "ambiguous": true in the JSON and return minimal/empty arrays for genres/keywords.
- Keep output minimal and valid. Arrays small (keywords 1–6, genres 0–4) with minor non-deterministic ordering.

Output only JSON with keys: genres, keywords, tempo, runtime_min, runtime_max, era, language, adult, moodResponse, ambiguous, inferredMood. No other keys.
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
      inferredMood: { type: ["string", "null"] },
    },
    additionalProperties: false,
  };

  let parsed: any = null;
  try {
    parsed = await parseContents(prompt, schema);
  } catch (errStrict) {
    try {
      parsed = await parseContents(prompt);
    } catch (errLoose) {
      parsed = { moodResponse: moodResponse === "address" ? "address" : "match", ambiguous: false };
    }
  }

  // Ensure parsed is an object. If the LLM returned an array (e.g., just a list of genres),
  // coerce it into the expected object shape so downstream code doesn't treat the array
  // as the whole parsed payload.
  if (Array.isArray(parsed)) {
    parsed = { genres: parsed.slice(0, 4), keywords: [], moodResponse: moodResponse === "address" ? "address" : "match", ambiguous: false };
  } else {
    parsed = parsed && typeof parsed === "object" ? parsed : { moodResponse: moodResponse === "address" ? "address" : "match", ambiguous: false };
  }

  // +++ CRITICAL: always ensure inferredMood is set if we detected one +++
  if (effectiveMood && !parsed.inferredMood) {
    parsed.inferredMood = effectiveMood;
  }

  // +++ New: If the user provided an explicit mood but the text strongly
  // indicates a different mood (and they did not explicitly ask to keep the
  // provided mood), mark the input ambiguous so callers can surface that to
  // the user. This centralizes the mismatch detection in the NLP pipeline.
  try {
    const textInferred = inferMoodFromText(safeText);
    const userProvidedMood = mood && String(mood).trim() ? mood : undefined;
    const askedToKeep = explicitKeepMood(safeText, userProvidedMood);
    if (userProvidedMood && textInferred && !askedToKeep) {
      if (String(userProvidedMood).toLowerCase() !== String(textInferred).toLowerCase()) {
        parsed.ambiguous = true;
        parsed.inferredMood = textInferred;
      }
    }
  } catch (e) {
    // non-fatal — leave existing parsed flags as-is
  }

  const requestedMoodResponse = moodResponse === "address" ? "address" : "match";
  parsed.moodResponse = requestedMoodResponse;
  parsed.ambiguous = Boolean(parsed.ambiguous === true);

  const genresArr = coerceToStringArray(parsed.genres);
  const keywordsArr = coerceToStringArray(parsed.keywords);

  let singleKeywords = normalizeKeywordsToSingleWords(keywordsArr || [], safeText, 8);

  if (!singleKeywords || singleKeywords.length === 0) {
    singleKeywords = extractKeywordsFromText(safeText, 8);
  }

  const moodForHints = effectiveMood;
  const keepMood = explicitKeepMood(safeText, mood);

  if (parsed.ambiguous) {
    parsed.keywords = [];
    parsed.genres = [];
    parsed.moodResponse = requestedMoodResponse;
    // +++ Still return inferredMood even for ambiguous inputs +++
    if (effectiveMood) {
      parsed.inferredMood = effectiveMood;
    }
    return parsed;
  }

  if (moodForHints && !keepMood) {
    const moodKey = Object.keys(MOOD_KEYWORD_HINTS).find((k) => k.toLowerCase() === moodForHints.toLowerCase());
    const hints = moodKey ? MOOD_KEYWORD_HINTS[moodKey] : null;

    if (parsed.moodResponse === "match" && hints?.match?.length) {
      const need = 2;
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

  const finalKeywords = Array.from(new Set(singleKeywords.map((k) => (k || "").toLowerCase())))
    .filter(Boolean)
    .slice(0, 8);
  parsed.keywords = maybeShuffleArray(finalKeywords);

  let finalGenres: string[] = [];
  if (Array.isArray(genresArr) && genresArr.length > 0) {
    finalGenres = genresArr.slice(0, 4).map((g) => (g || "").trim()).filter(Boolean);
  } else if (moodForHints) {
    // Use case-insensitive helper to fetch genres for the mood (handles lowercase/variants)
    try {
      finalGenres = getGenresForMood(moodForHints, parsed.moodResponse || requestedMoodResponse).slice(0, 4);
    } catch (e) {
      finalGenres = [];
    }
  }

  if (finalGenres.length === 0) {
    const inferred = inferGenresFromKeywords(parsed.keywords || []);
    finalGenres = inferred.slice(0, 3);
  }

  parsed.genres = normalizeGenres(Array.from(new Set(finalGenres)).slice(0, 4));
  parsed.genres = maybeShuffleArray(parsed.genres);

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

// Normalize genre names to canonical TMDb-like labels
export function normalizeGenres(genres?: string[]) {
  if (!Array.isArray(genres)) return [];
  const CANONICAL: Record<string, string> = {
    action: "Action",
    adventure: "Adventure",
    animation: "Animation",
    comedy: "Comedy",
    crime: "Crime",
    documentary: "Documentary",
    drama: "Drama",
    family: "Family",
    fantasy: "Fantasy",
    history: "History",
    horror: "Horror",
    music: "Music",
    musical: "Music",
    mystery: "Mystery",
    romance: "Romance",
    "science fiction": "Science Fiction",
    "science-fiction": "Science Fiction",
    "sci-fi": "Science Fiction",
    scifi: "Science Fiction",
    "tv movie": "TV Movie",
    "tvmovie": "TV Movie",
    thriller: "Thriller",
    war: "War",
    western: "Western",
  };

  const out: string[] = [];
  for (const g of genres) {
    if (!g) continue;
    const key = String(g).trim().toLowerCase();
    const canonical = CANONICAL[key] || CANONICAL[key.replace(/s$/, "")] || (g[0]?.toUpperCase() + g.slice(1));
    if (canonical && !out.includes(canonical)) out.push(canonical);
    if (out.length >= 4) break;
  }
  return out;
}

// Public helper: get keyword hints for a mood and response type
export function getKeywordsForMood(mood?: string, response: "match" | "address" = "match") {
  if (!mood) return [];
  const key = Object.keys(MOOD_KEYWORD_HINTS).find((k) => k.toLowerCase() === mood.toLowerCase());
  if (!key) return [];
  const pick = MOOD_KEYWORD_HINTS[key];
  if (!pick) return [];
  const arr = response === "address" ? pick.address : pick.match;
  return Array.isArray(arr) ? arr.slice(0, 8) : [];
}