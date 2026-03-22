import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ mode: string }> }) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const { mode } = await params;
    
    if (!apiKey || apiKey.startsWith("dummy_")) {
      console.error("Missing valid DEEPSEEK_API_KEY in environment variables");
      return NextResponse.json({ error: "Deepseek API Key not configured" }, { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey
    });
    
    const { topic, complexity } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const complexityStr = complexity ? complexity.toString() : "50";
    
    let systemPrompt = `You are Flux, an expert AI tutor. The user wants to learn about: "${topic}". The requested complexity level is ${complexityStr}/100 (0=ELI5, 100=Post-Graduate).`;
    
    let isJsonMode = false;

    // Route based on requested mode
    switch (mode) {
      case 'notes':
        systemPrompt += `
        Provide a highly structured, educational set of notes.
        Requirements:
        1. Format entirely in Markdown.
        2. Use clear headings (H3, H4).
        3. Include an insightful '💡 Key Insight' block quote.
        4. Use bullet points for readability.
        5. Keep it concise but comprehensive (around 200-300 words).`;
        break;
      
      case 'flashcards':
        isJsonMode = true;
        systemPrompt += `
        Create a set of 5 to 7 Flashcards to help memorize key concepts.
        You MUST respond in valid JSON format matching this exact schema:
        {
          "flashcards": [
            { "front": "Concept or Question", "back": "Definition or Answer" }
          ]
        }`;
        break;

      case 'quiz':
        isJsonMode = true;
        systemPrompt += `
        Create a 5-question multiple choice quiz to test knowledge.
        You MUST respond in valid JSON format matching this exact schema:
        {
          "quiz": [
            {
              "question": "The question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer_index": 0,
              "explanation": "Why this is correct"
            }
          ]
        }`;
        break;

      case 'quest':
        isJsonMode = true;
        systemPrompt += `
        Create an interactive text-based RPG 'Quest' scenario to teach the topic. 
        Set up an immersive scene where the user has to make a choice to proceed.
        You MUST respond in valid JSON format matching this exact schema:
        {
          "story": "The narrative setup and the immediate problem facing the hero...",
          "options": ["Choice 1", "Choice 2", "Choice 3"]
        }`;
        break;

      case 'visual':
        systemPrompt += `
        Create a visual graph representing the relationships within this topic.
        You MUST respond with RAW Mermaid.js code ONLY. Do not use markdown code blocks (\`\`\`).
        Start directly with 'graph TD' or 'mindmap'.`;
        break;

      default:
        return NextResponse.json({ error: "Invalid generic mode" }, { status: 400 });
    }

    const completionResponse = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "deepseek-chat",
      response_format: isJsonMode ? { type: "json_object" } : { type: "text" }
    });

    const rawContent = completionResponse.choices[0].message.content || "";
    const parsedResult = isJsonMode ? JSON.parse(rawContent) : rawContent;

    return NextResponse.json({ result: parsedResult });
  } catch (error: any) {
    console.error(`Deepseek API Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
