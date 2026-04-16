import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are ViralScript AI — an expert at writing viral 60-second African-style short-form video scripts for TikTok, Reels, and Shorts.

RULES:
- Output exactly 7-8 scenes, each ~8 seconds
- Each scene MUST have: sceneNumber, duration, camera, action, dialogue, engagement
- Use handheld/raw camera style (shake, quick zoom, snap zoom, whip pan)
- Realistic African dialogue (mix English + local slang naturally)
- Hook must be in the first 3 seconds — grab attention instantly
- Every scene must drive engagement (comments, shares, saves)
- Dialogue should feel natural, like real people talking on the streets
- Use relatable African situations (family, hustle, relationships, food, etc.)
- Keep it fast-paced — no boring filler
- Engagement hooks: ask questions, create suspense, use cliffhangers

OUTPUT FORMAT — Return ONLY valid JSON (no markdown, no code fences):
{
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": "0:00 - 0:08",
      "camera": "description of camera movement",
      "action": "what's happening physically",
      "dialogue": "what characters say",
      "engagement": "why viewer keeps watching"
    }
  ],
  "rawText": "The full script in a clean copy-paste format with scene separators"
}`;

export async function POST(req: NextRequest) {
  try {
    const { idea, tone } = await req.json();

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return NextResponse.json({ error: "Please provide a video idea" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured. Please set OPENROUTER_API_KEY." },
        { status: 500 }
      );
    }

    const userMessage = `Create a viral 60-second African-style short-form video script for this idea:

IDEA: ${idea.trim()}
TONE/VIBE: ${tone || "comedy"}

Remember: 7-8 scenes, ~8 seconds each, raw handheld camera style, realistic African dialogue with slang, hook in first 3 seconds, engagement drivers in every scene. Return ONLY valid JSON.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://viral-script.vercel.app",
        "X-Title": "ViralScript AI",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("OpenRouter API error:", response.status, errBody);
      return NextResponse.json(
        { error: `AI service error (${response.status}). Please try again.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI returned empty response. Try again." },
        { status: 502 }
      );
    }

    // Try to parse JSON from the response
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code fences or other wrappers
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object in the text
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          parsed = JSON.parse(objectMatch[0]);
        } else {
          // If all parsing fails, return raw text
          return NextResponse.json({
            scenes: [],
            rawText: content,
            formatted: content,
          });
        }
      }
    }

    // Validate scenes
    if (parsed.scenes && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
      return NextResponse.json({
        scenes: parsed.scenes,
        rawText: parsed.rawText || "",
        formatted: parsed.rawText || "",
      });
    }

    // If no valid scenes, return whatever we got
    return NextResponse.json({
      scenes: [],
      rawText: content,
      formatted: content,
    });
  } catch (error: any) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
