export function parseAgentResponse(raw: string) {
  if (!raw) return null;

  // 1. Try to find the JSON block between ```json and ``` or just ```
  let jsonStr = "";
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fenceMatch) {
    jsonStr = fenceMatch[1];
  } else {
    // 2. Fallback: Extract the first balanced JSON object in the string
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = raw.substring(firstBrace, lastBrace + 1);
    }
  }

  if (!jsonStr) {
    console.warn("No JSON content found in AI response:", raw);
    return null;
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.warn("Failed to parse AI JSON. Attempting aggressive cleaning...");

    try {
      // Aggressive cleaning: remove common model hallucinations
      const cleaned = jsonStr
        .replace(/,\s*([\]}])/g, "$1") // trailing commas
        .replace(/(\r\n|\n|\r)/gm, " ") // newlines
        .replace(/\s+/g, " ")           // extra whitespace
        .trim();
      return JSON.parse(cleaned);
    } catch {
      console.error("Critical failure parsing AI JSON");
      return null;
    }
  }
}
