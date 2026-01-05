// app/api/agent/route.ts
import { NextRequest, NextResponse } from "next/server";

interface OllamaPayload {
  model: string;
  prompt: string;
  stream: boolean;
  format: "json";
  options: {
    temperature: number;
    top_p: number;
    top_k: number;
    repeat_penalty?: number;
  };
}

async function callOllama(fullPrompt: string, stream = false): Promise<string | ReadableStream> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

  const payload: OllamaPayload = {
    model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "codellama:latest",
    prompt: fullPrompt,
    stream,
    format: "json",
    options: {
      temperature: 0.0,           // maximum determinism
      top_p: 0.85,
      top_k: 30,
      repeat_penalty: 1.1,
    },
  };

  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Ollama error ${res.status}: ${errorText}`);
    }

    if (!stream) {
      const data = await res.json();
      let response = data.response?.trim() ?? "";
      // Aggressive cleaning
      response = response
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .replace(/^\s*{\s*/, "{")
        .replace(/\s*}\s*$/, "}")
        .trim();
      return response;
    }

    return res.body!;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out after 5 minutes");
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, project, stream = false } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid prompt" }, { status: 400 });
    }

    // ── STRICTEST SYSTEM PROMPT ──
    const systemPrompt = `
You are a highly specialized AI assistant that exports Next.js projects as JSON.
Your task: Convert the user's request into a set of files.

OUTPUT REQUIREMENTS:
- RETURN ONLY A JSON OBJECT. NO PROSE. NO CHAT. NO EXPLANATIONS.
- The JSON must follow this exact schema:
{
  "files": {
    "app/layout.tsx": "code...",
    "app/page.tsx": "code...",
    "components/MyComponent.tsx": "code..."
  }
}
- All code must be TypeScript/TSX.
- Use Tailwind CSS for styling.
- Ensure all components are export default.
- Use 'use client' for components with hooks.

FAILURE TO RETURN VALID JSON WILL CAUSE SYSTEM ERROR.
User request: ${prompt}

Current project files (reference):
${JSON.stringify(project?.frontendFiles || {}, null, 2)}
`;

    if (!stream) {
      console.log("🤖 Requesting non-streamed response from Ollama...");
      const raw = await callOllama(systemPrompt, false);
      console.log("🤖 Raw response length:", (raw as string).length);
      console.log("🤖 Raw response preview:", (raw as string).slice(0, 500));

      try {
        JSON.parse(raw as string);
        console.log("✅ Valid JSON received from Ollama");
      } catch {
        console.warn("⚠️ Invalid JSON from Ollama. Attempting to fix in parser...");
      }

      return NextResponse.json({ success: true, raw });
    }

    const bodyStream = await callOllama(systemPrompt, true);
    if (!bodyStream) {
      return NextResponse.json({ success: false, error: "Stream unavailable" }, { status: 500 });
    }

    return new Response(bodyStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: unknown) {
    console.error("Agent API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}