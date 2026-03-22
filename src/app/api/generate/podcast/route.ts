import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Rachel (or any default ElevenLabs voice)

export async function POST(req: Request) {
  try {
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
    
    if (!deepseekKey || !elevenlabsKey) {
      return NextResponse.json({ error: "API Keys not fully configured for Podcast Mode" }, { status: 500 });
    }

    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Step 1: Generate the podcast script utilizing Deepseek
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: deepseekKey
    });

    const scriptPrompt = `
      You are Flux, an engaging educational podcast host. 
      Write a short, exciting 1-minute podcast script explaining the topic: "${topic}".
      Do not include speakers' names or stage directions. Write purely the spoken word.
      Keep it conversational, punchy, and highly educational.
    `;

    const scriptResponse = await openai.chat.completions.create({
      messages: [{ role: "system", content: scriptPrompt }],
      model: "deepseek-chat",
    });

    const scriptText = scriptResponse.choices[0].message.content || "";

    // Step 2: Convert Script to Audio via ElevenLabs
    const elevenlabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenlabsKey
      },
      body: JSON.stringify({
        text: scriptText,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!elevenlabsResponse.ok) {
      throw new Error(`ElevenLabs API error: ${elevenlabsResponse.statusText}`);
    }

    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUri = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({ 
      result: {
        script: scriptText,
        audioUrl: audioDataUri
      }
    });

  } catch (error: any) {
    console.error("Podcast Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate podcast" },
      { status: 500 }
    );
  }
}
