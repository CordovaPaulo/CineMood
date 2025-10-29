import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

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

  try {
    return JSON.parse(jsonish);
  } catch {
    const unescaped = jsonish
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(unescaped);
  }
}

export async function parseContents(prompt: string, schema?: any) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      temperature: 0.2,
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
