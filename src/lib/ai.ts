import { GoogleGenerativeAI } from "@google/generative-ai";
export type ModeId = "notes" | "flashcards" | "quiz" | "quest" | "visual" | "podcast" | "audio";

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
  
  console.log(`[AI.${mode}] fileContent received: ${fileContent ? fileContent.length : 0} chars`);
  if (!fileContent || fileContent.length === 0) {
    console.log(`[AI.${mode}] ⚠ WARNING: No file content provided!`);
  }
  
  if (!process.env.NODE_ENV?.includes('test')) {
    console.log(`[AI] Gemini Key Loaded: ${geminiKey ? '✓ Yes (' + geminiKey.substring(0, 10) + '...)' : '✗ No'} | Using Mock: ${isMock}`);
  }

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
      // Strip markers if present
      const cleanedContent = fileContent
        .replace("[RAW_EXTRACTION_BEGIN]\n", "")
        .replace("\n[RAW_EXTRACTION_END]", "")
        .replace("[RAW_EXTRACTION_BEGIN]", "")
        .replace("[RAW_EXTRACTION_END]", "")
        .trim();
        
      if (cleanedContent && cleanedContent.length > 0) {
        fullSystemInstruction += `\n\n[SOURCE MATERIAL - Primary Reference]\n${cleanedContent}\n[END SOURCE MATERIAL]`;
      }
    }
    
    // Debug logging
    if (fileContent && fileContent.trim()) {
      console.log(`[AI] File content detected: ${fileContent.substring(0, 100)}...`);
    } else {
      console.log(`[AI] WARNING: No file content provided for ${mode} mode`);
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: fullSystemInstruction
    });

    let userPrompt = "";
    let isJsonMode = false;

    switch (mode) {
      case 'notes':
        userPrompt = `You are an expert educator creating beautiful, visually engaging study notes. Transform the provided source material into professional study notes that are comprehensive, well-organized, and a pleasure to read.

REQUIREMENTS:

1. **Structure & Hierarchy**:
   - Start with an # (H1) title summarizing the topic
   - Use ## (H2) for major sections and ### (H3) for subsections
   - Create an **Executive Summary** section early to give overview
   - Follow with logical sections: Introduction → Core Concepts → Details → Key Terms → Practical Applications → Summary

2. **Content Depth**:
   - Extract ALL key definitions, formulas, laws, and technical details from the source
   - Explain complex concepts thoroughly with multiple examples
   - Include code snippets, equations, or examples EXACTLY as they appear in source
   - Connect ideas logically to show relationships

3. **Visual Formatting** (ESSENTIAL):
   - Use **bold** for key terms and important concepts on first mention
   - Use *italics* for emphasis and technical distinctions
   - Use > blockquotes for important insights, warnings, tips, or "remember this" moments
   - Use numbered lists (1. 2. 3.) for sequential steps or processes
   - Use bullet points (- or *) for features, characteristics, or non-sequential items
   - Use code blocks (\`\`\`language) for code examples, commands, or technical syntax
   - Use tables (|Col1|Col2|) for comparisons, data, timelines, or structured information

4. **Special Sections**:
   - Include a **Key Terms & Definitions** glossary section with important terms and their meanings
   - Include a **Pro Tips** or **Important Notes** section with > blockquotes highlighting critical insights
   - Include **Common Misconceptions** if applicable to address misunderstandings

5. **Formatting Quality**:
   - Fix any text extraction artifacts (missing spaces, broken sentences, formatting errors)
   - Ensure proper spacing between sections (one blank line between major sections, two blank lines between big sections)
   - Keep paragraphs concise and readable (3-4 sentences maximum per paragraph)
   - Use white space strategically to avoid walls of text

6. **Engagement**:
   - Make the notes engaging and interesting to read
   - Use clear, accessible language without losing technical accuracy
   - Include examples and real-world applications where relevant
   - Break up content with visual markers (tables, code blocks, blockquotes)

IMPORTANT: Start directly with the H1 title. Do NOT include any introductory text like "Sure, I can help you with that!" or "Here are the study notes...". Jump straight into the content.

Format the entire response in pristine GitHub-flavored Markdown with proper spacing and structure.`;
        break;
      
      case 'flashcards':
        isJsonMode = true;
        userPrompt = `Create a comprehensive set of 8-10 flashcards based on the source material.

REQUIREMENTS:
1. **Coverage**: Select the most important concepts, definitions, formulas, and practical applications
2. **Balance**: Mix concept questions with application questions for deeper learning
3. **Clarity**: Front should be a clear, concise question. Back should be complete but concise answer
4. **Formatting**: 
   - Use markdown formatting in answers (bold for key terms, code blocks for technical content, bullet points for lists)
   - Include examples or mnemonics where helpful
5. **Difficulty**: Progress from foundational to more advanced concepts

You MUST respond in valid JSON format:
{ "flashcards": [ { "front": "Question text", "back": "Answer with **bold** for key terms, bullets, code blocks as needed" } ] }`;
        break;

      case 'quiz':
        isJsonMode = true;
        userPrompt = `Create a 5-question multiple choice quiz that tests understanding of the source material.

REQUIREMENTS:
1. **Coverage**: Mix recall questions with comprehension and application questions
2. **Quality**: 
   - Each option should be plausible (avoid obviously wrong answers)
   - Explanations should clarify why the correct answer is right and why others are wrong
   - Include edge cases or common misconceptions in distractors
3. **Difficulty**: Progress from easier to more challenging questions
4. **Educational Value**: Explanations should deepen learning, not just confirm the answer

You MUST respond in valid JSON:
{ "quiz": [ { "question": "Q", "options": ["A","B","C","D"], "answer_index": 0, "explanation": "Clear explanation of the correct answer" } ] }`;
        break;

      case 'quest':
        isJsonMode = true;
        userPrompt = `Create an interactive text-based RPG 'Quest' scenario based on the source material. Make it educational and engaging!

REQUIREMENTS:
1. **Educational Tie-in**: Embed concepts from the source material into the narrative and decision points
2. **Narrative Quality**:
   - Write compelling story prose (2-3 sentences) that draws the player in
   - Make decisions meaningfully different (not just cosmetic variations)
   - Show consequences of choices through the next story segment
3. **Structure**:
   - Include vivid descriptions, dialogue, or world-building details
   - Present 3 meaningful choices (not 1, not 5)
   - Make some choices educationally significant (apply the learned concepts)

You MUST respond in valid JSON:
{ "story": "Engaging narrative text with world-building and situation setup", "options": ["First meaningful choice", "Second meaningful choice", "Third meaningful choice"] }`;
        break;

      case 'visual':
        userPrompt = `Create a visual graph or diagram representing key relationships and concepts from the source material.

REQUIREMENTS:
1. **Structure**: Choose the best visualization type:
   - 'graph TD' (flowchart) for processes, hierarchies, or decision flows
   - 'mindmap' for concept relationships and brainstorming
   - 'graph LR' for left-to-right relationships
2. **Content**: 
   - Show relationships between key concepts
   - Include 6-10 nodes representing important ideas
   - Use descriptive labels that are clear and concise
3. **Educational Value**: The diagram should help learners understand connections between concepts

You MUST respond with RAW Mermaid.js code ONLY. Do not use markdown code blocks (\`\`\`).
Start directly with 'graph', 'mindmap', or another Mermaid diagram type. Example: 'graph TD' or 'mindmap'`;
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

      case 'audio':
        // Audio is an alias for podcast
        return generateModeContent('podcast', topic, complexity, fileContent);

      default:
        return { result: null, error: "Invalid mode" };
    }

    const completion = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
    });

    const raw = completion.response.text() || "";
    
    if (isJsonMode) {
      // Parse JSON response with better error handling
      try {
        // Try to extract JSON from the response (in case there's extra text)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return { result: JSON.parse(jsonMatch[0]) };
        }
        // If no JSON found, try parsing the entire response
        return { result: JSON.parse(raw) };
      } catch (e) {
        console.error(`Failed to parse JSON for ${mode}:`, e, 'Raw response:', raw);
        // Return a reasonable default instead of an error
        return { result: generateDefaultContent(mode, topic), error: `JSON parse error in ${mode}` };
      }
    }
    
    return { result: raw };

  } catch (error: unknown) {
    console.error(`Generation error for ${mode}:`, error);
    // Return mock content on error
    const mockResult = generateMockContent(mode, topic, fileContent);
    return mockResult;
  }
}

function generateDefaultContent(mode: ModeId, topic: string): string | object {
  // Generate reasonable default content for each mode
  switch (mode) {
    case 'flashcards':
      return { 
        flashcards: [
          { front: `What is ${topic}?`, back: "A topic for study and learning." },
          { front: "Why is this important?", back: "It helps with understanding the subject." }
        ]
      };
    case 'quiz':
      return { 
        quiz: [
          { 
            question: `Which of these best describes ${topic}?`, 
            options: ["Option A", "Option B", "Option C", "Option D"], 
            answer_index: 0, 
            explanation: "This is the most accurate description." 
          }
        ]
      };
    case 'quest':
      return { 
        story: `You encounter a scenario related to ${topic}...`, 
        options: ["Choose option A", "Choose option B", "Choose option C"] 
      };
    case 'visual':
      return `graph TD\n  A["${topic}"] --> B["Key Concept 1"]\n  A --> C["Key Concept 2"]\n  B --> D["Application"]\n  C --> D`;
    case 'podcast':
      return { script: `Welcome to our podcast about ${topic}. Let's dive into the key aspects...`, audioUrl: null };
    default:
      return { content: `Information about ${topic}` };
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
    case 'audio':
      return { result: { script: `Welcome to the Flux audio immersion. Today we're diving into ${topic}. It's a fascinating area that combines art and science...`, audioUrl: null } };
    default:
      return { result: null, error: "Unknown mode" };
  }
}
