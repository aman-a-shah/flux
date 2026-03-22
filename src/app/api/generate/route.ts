import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "dummy_key_for_build";
    const ai = new GoogleGenAI({ apiKey });
    
    const { topic, complexity } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const complexityStr = complexity ? complexity.toString() : "50";
    
    const prompt = `
      You are an expert AI tutor named Flux.
      Provide a highly structured, educational set of notes on the following topic: "${topic}".
      The complexity level requested by the user is ${complexityStr}/100 
      (where 0 is 'explain like I am 5' and 100 is 'post-graduate level').
      
      Requirements:
      1. Format entirely in Markdown.
      2. Use clear headings (H3, H4).
      3. Include an insightful '💡 Key Insight' block quote or emphasized section.
      4. Use bullet points for easy reading.
      5. Keep it concise but comprehensive (around 200-300 words).
      
      Topic: ${topic}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
