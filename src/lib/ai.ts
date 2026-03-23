import { GoogleGenerativeAI } from "@google/generative-ai";
export type ModeId = "notes" | "flashcards" | "quiz" | "quest" | "visual" | "podcast";

interface GenerationResult {
  result: string | object | null;
  error?: string;
}

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Rachel

// COMMENTED OUT APIs (to be uncommented once Gemini API is working):
// - Other APIs in .env.local (OpenAI, Replicate, Pinecone, Tavily) are not currently used in code

export async function generateModeContent(mode: ModeId, topic: string, complexity: number, fileContent?: string): Promise<GenerationResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;

  const isMock = !geminiKey || geminiKey.startsWith("dummy_") || geminiKey === "" || geminiKey === "your-gemini-api-key-here";

  try {
    if (isMock) {
      console.log(`Using mock mode for ${mode} (Key missing or dummy)`);
      return generateMockContent(mode, topic, fileContent);
    }

    const genAI = new GoogleGenerativeAI(geminiKey);

    const complexityStr = complexity.toString();
    const systemInstruction = `You are Flux, an expert AI tutor. The user wants to learn about: "${topic}". The requested complexity level is ${complexityStr}/100 (0=ELI5, 100=Post-Graduate).`;

    // Include file content in system instruction if available
    let fullSystemInstruction = systemInstruction;
    if (fileContent && fileContent.trim()) {
      fullSystemInstruction += `\n\nUse the following content from uploaded files as the primary source material for generating the requested content:\n${fileContent}`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: fullSystemInstruction
    });

    let userPrompt = "";
    let isJsonMode = false;

    switch (mode) {
      case 'notes':
        userPrompt = `Provide a highly structured, educational set of notes.
        Requirements:
        1. Format entirely in Markdown.
        2. Use clear headings (H3, H4).
        3. Include an insightful '💡 Key Insight' block quote.
        4. Use bullet points for readability.
        5. Keep it concise but comprehensive (around 200-300 words).`;
        break;
      
      case 'flashcards':
        isJsonMode = true;
        userPrompt = `Create a set of 5 to 7 Flashcards.
        You MUST respond in valid JSON format:
        { "flashcards": [ { "front": "Q", "back": "A" } ] }`;
        break;

      case 'quiz':
        isJsonMode = true;
        userPrompt = `Create a 5-question multiple choice quiz.
        You MUST respond in valid JSON:
        { "quiz": [ { "question": "Q", "options": ["A","B","C","D"], "answer_index": 0, "explanation": "E" } ] }`;
        break;

      case 'quest':
        isJsonMode = true;
        userPrompt = `Create an interactive text-based RPG 'Quest' scenario.
        You MUST respond in valid JSON:
        { "story": "...", "options": ["C1", "C2", "C3"] }`;
        break;

      case 'visual':
        userPrompt = `Create a visual graph representing relationships.
        You MUST respond with RAW Mermaid.js code ONLY. Do not use markdown code blocks (\`\`\`).
        Start directly with 'graph TD' or 'mindmap'.`;
        break;

      case 'podcast':
        // Podcast logic is special (Script + Audio)
        const scriptPrompt = `You are Flux, a podcast host. Write a short 1-minute script about "${topic}". Spoken word only.`;
        const scriptResp = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: scriptPrompt }] }]
        });
        const scriptText = scriptResp.response.text();

        if (!elevenlabsKey) {
            return { result: { script: scriptText, audioUrl: null }, error: "ElevenLabs key missing" };
        }

        const audioResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: "POST",
          headers: { "Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": elevenlabsKey },
          body: JSON.stringify({ text: scriptText, model_id: "eleven_monolingual_v1" })
        });

        if (!audioResp.ok) throw new Error("ElevenLabs failure");
        const audioBuffer = await audioResp.arrayBuffer();
        const audioUrl = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;
        return { result: { script: scriptText, audioUrl } };

      default:
        return { result: null, error: "Invalid mode" };
    }

    const completion = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
    });

    const raw = completion.response.text() || "";
    return { result: isJsonMode ? JSON.parse(raw) : raw };

  } catch (error: unknown) {
    console.error(`Generation error for ${mode}:`, error);
    return { result: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function generateMockContent(mode: ModeId, topic: string, fileContent?: string): Promise<GenerationResult> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1000));

  const contentSource = fileContent && fileContent.trim() ? `based on uploaded content` : `about ${topic}`;

  switch (mode) {
    case 'notes':
      return { result: `### Notes on ${topic}\n\nThis is a highly structured set of notes ${contentSource}. \n\n#### Key Areas\n- **Concept 1**: Foundational principles.\n- **Concept 2**: Advanced applications.\n\n> 💡 Key Insight: Understanding ${topic} requires a holistic view of its components.\n\nSummary: Flux has synthesized this content for your learning journey in mock mode.` };
    case 'flashcards':
      return { result: { flashcards: [
        { front: `What is the primary goal of ${topic}?`, back: "To provide a comprehensive framework for learning." },
        { front: "Who is the target audience?", back: "Students and lifelong learners using Flux." }
      ]}};
    case 'quiz':
      return { result: { quiz: [
        { question: `Which of these best describes ${topic}?`, options: ["Option A", "Option B", "Option C", "Option D"], answer_index: 0, explanation: "Correct because it aligns with standard definitions." }
      ]}};
    case 'quest':
      return { result: { story: `You arrive at the Temple of ${topic}. A sage approaches you with a challenge...`, options: ["Accept the challenge", "Ask for training", "Meditate"] }};
    case 'visual':
      return { result: `graph TD\n  A[${topic}] --> B(Phase 1)\n  A --> C(Phase 2)\n  B --> D{Result}\n  C --> D` };
    case 'podcast':
      return { result: { script: `Welcome to the Flux podcast. Today we're diving into ${topic}. It's a fascinating area that combines art and science...`, audioUrl: null } };
    default:
      return { result: null, error: "Unknown mode" };
  }
}
