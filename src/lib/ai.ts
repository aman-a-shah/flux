import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
export type ModeId = "notes" | "flashcards" | "quiz" | "quest" | "visual" | "podcast" | "audio";

interface GenerationResult {
  result: string | object | null;
  error?: string;
}

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Rachel

// COMMENTED OUT APIs (to be uncommented once Cerebras API is working):
// - Other APIs in .env.local (OpenAI, Replicate, Pinecone, Tavily) are not currently used in code

async function generateAudio(text: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey.startsWith("dummy") || apiKey === "") {
    console.log("[AI.Audio] ElevenLabs key missing or dummy, skipping audio generation.");
    // Return silent MP3 to allow frontend to render the player/script
    return "data:audio/mp3;base64,SUQzBAAAAAAAI1RTSVMAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAA=";
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const audioStream = await client.textToSpeech.convert(VOICE_ID, {
      text: text.slice(0, 5000),
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks);
    return `data:audio/mpeg;base64,${content.toString('base64')}`;
  } catch (error) {
    console.error("[AI.Audio] Generation failed:", error);
    // Return silent MP3 on error to prevent frontend breakage
    return "data:audio/mp3;base64,SUQzBAAAAAAAI1RTSVMAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAAA=";
  }
}

async function generateImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    console.log("[AI.Image] Replicate key missing, skipping image generation.");
    return null;
  }

  try {
    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Prefer": "wait"
      },
      body: JSON.stringify({
        input: {
          prompt: `${prompt}, fantasy art style, cinematic lighting, highly detailed, 4k`,
          aspect_ratio: "16:9",
          go_fast: true
        }
      })
    });

    const result = await response.json();
    if (result.output && Array.isArray(result.output) && result.output.length > 0) {
      return result.output[0];
    }
    return null;
  } catch (error) {
    console.error("[AI.Image] Generation failed:", error);
    return null;
  }
}

function cleanJsonString(str: string): string {
  let inString = false;
  let escaped = false;
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (inString) {
      if (escaped) {
        result += char;
        escaped = false;
      } else if (char === '\\') {
        result += char;
        escaped = true;
      } else if (char === '"') {
        result += char;
        inString = false;
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else if (char.charCodeAt(0) < 0x20) {
        // Skip other control characters
      } else {
        result += char;
      }
    } else {
      if (char === '"') {
        inString = true;
      }
      result += char;
    }
  }
  return result;
}

export async function generateModeContent(mode: ModeId, topic: string, complexity: number, fileContent?: string, continueQuest?: { choice: string; previousStory: string; step: number }): Promise<GenerationResult> {
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

  const isMock = !cerebrasKey || cerebrasKey.startsWith("dummy_") || cerebrasKey === "" || cerebrasKey === "your-cerebras-api-key-here";

  console.log(`[AI.${mode}] fileContent received: ${fileContent ? fileContent.length : 0} chars`);

  try {
    if (isMock) {
      console.log(`[AI.${mode}] Using mock mode for ${mode} (Key missing or dummy)`);
      return generateMockContent(mode, topic, fileContent);
    }

    console.log(`[AI.${mode}] Making API call to Cerebras...`);
    const cerebras = new Cerebras({
      apiKey: cerebrasKey
    });

    const complexityStr = complexity.toString();
    const systemInstruction = `You are Flux, an expert AI tutor. The user wants to learn about: "${topic}". The requested complexity level is ${complexityStr}/100 (0=ELI5, 100=Post-Graduate).`;

    // Create a context block from file content to prepend to the user prompt
    let contextBlock = "";
    if (fileContent && fileContent.trim()) {
      // Strip markers if present
      const cleanedContent = fileContent
        .replace("[RAW_EXTRACTION_BEGIN]\n", "")
        .replace("\n[RAW_EXTRACTION_END]", "")
        .replace("[RAW_EXTRACTION_BEGIN]", "")
        .replace("[RAW_EXTRACTION_END]", "")
        .trim();

      if (cleanedContent && cleanedContent.length > 0) {
        contextBlock = `Use the following source material as your primary reference:\n\n--- SOURCE MATERIAL ---\n${cleanedContent}\n--- END SOURCE MATERIAL ---\n\n`;
        console.log(`[AI.${mode}] Included ${cleanedContent.length} chars of source material in prompt`);
      }
    }

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
   - Return valid JSON ONLY as an object:
     { "flashcards": [ { "front": "...", "back": "..." } ] }
   - Use bold markdown in value text for key terms
5. **Difficulty**: Progress from foundational to more advanced concepts

IMPORTANT: This response must be valid JSON; do not include additional text outside JSON.`;
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
5. **Formatting**:
   - Return valid JSON ONLY:
     { "quiz": [ { "question": "...", "options": ["...","...","...","..."], "answer_index": 0, "explanation": "..." } ] }

IMPORTANT: This response must be valid JSON; do not add any freeform text.`;
        break;

      case 'quest':
        isJsonMode = true;
        if (continueQuest) {
          userPrompt = `Continue the interactive text-based RPG 'Quest' scenario based on the source material.

Previous story so far: "${continueQuest.previousStory}"

The player chose: "${continueQuest.choice}"

Current step: ${continueQuest.step}

REQUIREMENTS:
1. **Continue the Narrative**: Write the next story segment (2-3 sentences) that follows from the player's choice.
2. **Evaluate Choice**: Determine if the choice was educationally correct or appropriate based on the source material. If correct, progress positively; if incorrect, show consequences.
3. **Game Logic**: 
   - If this is step 3 or later, decide if the player wins (good choices) or loses (bad choices).
   - Include "win": true or "lose": true in the response if the game ends.
    - Include a "visual": "Description of the scene..." field for image generation.
4. **Structure**:
   - Present 3 new meaningful choices for the next step, or empty array if game ended.
   - Make choices educationally significant.
5. **Formatting**:
   - Return valid JSON ONLY:
    { "story": "...", "visual": "...", "options": ["...", "...", "..."], "step": ${continueQuest.step + 1} }


IMPORTANT: This response must be valid JSON; do not add any freeform text.`;
        } else {
          userPrompt = `Create an interactive text-based RPG 'Quest' scenario based on the source material. Make it educational and engaging!

REQUIREMENTS:
1. **Educational Tie-in**: Embed concepts from the source material into the narrative and decision points
2. **Narrative Quality**:
   - Write compelling story prose (2-3 sentences) that draws the player in
   - Make decisions meaningfully different (not just cosmetic variations)
   - Show consequences of choices through the next story segment
3. **Structure**:
   - Include vivid descriptions, dialogue, or world-building details
   - Include a "visual": "Description of the scene..." field.
   - Present 3 meaningful choices (not 1, not 5)
   - Make some choices educationally significant (apply the learned concepts)
4. **Formatting**:
   - Return valid JSON ONLY:
    { "story": "...", "visual": "...", "options": ["...", "...", "..."], "step": 1 }


IMPORTANT: This response must be valid JSON; do not add any freeform text.`;
        }
        break;

      case 'visual':
        isJsonMode = true;
        userPrompt = `Create a hierarchical mind map representing the key concepts and relationships from the source material.

REQUIREMENTS:
1. **Output Format**: Return valid JSON representing a tree structure.
2. **Structure**:
   - Root node: Main topic.
   - Children: Subtopics, key concepts, or related ideas.
   - Depth: Ensure at least 2-3 levels of hierarchy to show relationships.
3. **Content**:
   - "id": A unique string identifier.
   - "label": Concise title for the node (max 3-5 words).
   - "description": A brief explanation or context (1 sentence).
   - "children": Array of child nodes.
4. **JSON Schema**:
   { "root": { "id": "string", "label": "string", "description": "string", "children": [ ... ] } }

IMPORTANT: Return ONLY valid JSON. No markdown formatting, no code blocks.`;
        break;

      case 'podcast':
        isJsonMode = true;
        userPrompt = `You are a podcast host. Create a short, engaging podcast script summarizing the key points from the provided source material about "${topic}".

REQUIREMENTS:
1. **Style**: Conversational, spoken-word style. Educational but entertaining.
2. **Length**: 150-200 words (concise).
3. **Structure**: Intro -> Key Concepts -> Conclusion.
4. **Formatting**: Return valid JSON ONLY.
   { "title": "Episode Title", "script": "The spoken content of the podcast..." }

IMPORTANT: The "script" field should ONLY contain the spoken text to be fed into a Text-to-Speech engine. Do not include speaker labels (e.g. "Host:") or sound effects in the script text.`;
        break;

      case 'audio':
        // Audio is an alias for podcast
        return generateModeContent('podcast', topic, complexity, fileContent);

      default:
        return { result: null, error: "Invalid mode" };
    }

    const completion = await cerebras.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `${contextBlock}${userPrompt}` }
      ],
      model: 'llama3.1-8b',
      max_completion_tokens: 8192,
      temperature: 0.2,
      top_p: 1,
      stream: false
    });

    const raw = (completion as any).choices[0].message.content || "";

    console.log(`[AI.${mode}] API call completed, response length: ${raw.length} chars`);

    if (!raw || raw.trim().length === 0) {
      console.error(`[AI.${mode}] Empty response from API, falling back to mock`);
      return generateMockContent(mode, topic, fileContent);
    }

    if (isJsonMode) {
      let cleaned = raw.trim();

      // Attempt to extract JSON from markdown fences
      const fenceMatch = cleaned.match(/^```(\w+)?\s*([\s\S]*?)\s*```$/);
      if (fenceMatch) {
        cleaned = fenceMatch[2].trim();
      }

      const processParsedJson = async (parsed: any) => {
        if (parsed && typeof parsed === 'object') {
          // Post-processing for audio generation
          if ((mode === 'podcast' || mode === 'audio') && parsed.script) {
             console.log(`[AI.${mode}] Generating audio for script (${parsed.script.length} chars)...`);
             const audioUrl = await generateAudio(parsed.script);
             if (audioUrl) {
               parsed.audioUrl = audioUrl;
             }
          }

          // Post-processing for Quest Image generation
          if (mode === 'quest' && parsed.visual) {
             console.log(`[AI.Quest] Generating image for scene: "${parsed.visual.substring(0, 30)}..."`);
             const imageUrl = await generateImage(parsed.visual);
             if (imageUrl) {
               parsed.imageUrl = imageUrl;
             }
          }
          return { result: parsed };
        }
        return null;
      };

      // First attempt: clean parse
      try {
        const parsed = JSON.parse(cleaned);
        const processed = await processParsedJson(parsed);
        if (processed) return processed;
      } catch (jsonError) {
        // Try repairing JSON
        try {
          const repaired = cleanJsonString(cleaned);
          const parsed = JSON.parse(repaired);
          const processed = await processParsedJson(parsed);
          if (processed) {
            console.log(`[AI.${mode}] JSON repaired and parsed successfully`);
            return processed;
          }
        } catch (repairError) {
          // ignore
        }

        // Second attempt: extract JSON from text (in case of chatty prefix/suffix)
        const firstCurly = cleaned.indexOf('{');
        const lastCurly = cleaned.lastIndexOf('}');
        
        if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
           const potentialJson = cleaned.substring(firstCurly, lastCurly + 1);
           try {
              const parsed = JSON.parse(potentialJson);
              const processed = await processParsedJson(parsed);
              if (processed) return processed;
           } catch (e2) {
              console.error(`[AI.${mode}] Extraction parse failed`, e2);
              
              // Try repairing extracted JSON
              try {
                const repaired = cleanJsonString(potentialJson);
                const parsed = JSON.parse(repaired);
                const processed = await processParsedJson(parsed);
                if (processed) {
                  console.log(`[AI.${mode}] Extracted JSON repaired and parsed successfully`);
                  return processed;
                }
              } catch (e3) { /* ignore */ }
           }
        }
        
        console.error(`[AI.${mode}] JSON parse failed`, jsonError);
      }

      // fallback if parse failed
      console.warn(`[AI.${mode}] JSON mode failed to parse; falling back to default object`);
      return { result: generateDefaultContent(mode, topic), error: `JSON parse error in ${mode}` };
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
        options: ["Choose option A", "Choose option B", "Choose option C"],
        step: 1
      };
    case 'visual':
      return `graph TD\n  A["${topic}"] --> B["Key Concept 1"]\n  A --> C["Key Concept 2"]\n  B --> D["Application"]\n  C --> D`;
    case 'podcast':
      return { script: `Welcome to our podcast about ${topic}. Let's dive into the key aspects...`, audioUrl: null };
    default:
      return { content: `Information about ${topic}` };
  }
}

export async function generateSessionTitleAI(extractedContent: string): Promise<string> {
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

  const isMock = !cerebrasKey || cerebrasKey.startsWith("dummy_") || cerebrasKey === "" || cerebrasKey === "your-cerebras-api-key-here";

  try {
    if (isMock) {
      // Generate a simple mock title based on content
      const content = extractedContent.trim();
      if (content.length > 50) {
        // Try to extract a meaningful phrase
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        if (sentences.length > 0) {
          const firstSentence = sentences[0].trim();
          if (firstSentence.length < 60) {
            return firstSentence;
          }
        }
        // Extract first few words
        const words = content.split(/\s+/).slice(0, 5);
        return words.join(' ') + '...';
      }
      return "Study Session";
    }

    console.log(`[AI.Title] Making API call to Cerebras for session title...`);
    const cerebras = new Cerebras({
      apiKey: cerebrasKey
    });

    const systemInstruction = `You are an expert at creating concise, descriptive titles for study sessions. Generate a short, engaging title (3-8 words) that captures the essence of the study material. The title should be descriptive and indicate what the session is about, similar to how ChatGPT names conversations.`;

    const userPrompt = `Based on the following study material, create a concise, descriptive title for this study session:

${extractedContent.substring(0, 5000)}

Title:`;

    const response = await cerebras.chat.completions.create({
      model: "llama3.1-8b",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (raw && raw.length > 0) {
      // Clean up the response - remove quotes if present
      const cleaned = raw.replace(/^["']|["']$/g, '').trim();
      if (cleaned.length > 0 && cleaned.length < 100) {
        return cleaned;
      }
    }

    // Fallback
    return "Study Session";

  } catch (error: unknown) {
    console.error(`Title generation error:`, error);
    return "Study Session";
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
      return { result: `1. **Front:** What is the primary goal of ${topic}?
   **Back:** To provide a comprehensive framework for learning and understanding key concepts.

2. **Front:** Who is the target audience for ${topic}?
   **Back:** Students and lifelong learners using Flux to enhance their knowledge.

3. **Front:** What are the main benefits of studying ${topic}?
   **Back:** Improved understanding, better problem-solving skills, and practical application of concepts.

4. **Front:** How does ${topic} relate to real-world applications?
   **Back:** ${topic} provides foundational knowledge that can be applied to various real-world scenarios and challenges.` };
    case 'quiz':
      return { result: `1. **Question:** Which of these best describes ${topic}?
   **Options:**
   A) A comprehensive framework for learning
   B) A simple concept with limited applications
   C) An outdated approach to education
   D) A purely theoretical subject
   **Correct Answer:** A) A comprehensive framework for learning
   **Explanation:** ${topic} provides a structured approach to understanding complex concepts and their applications.

2. **Question:** What is the primary purpose of studying ${topic}?
   **Options:**
   A) To memorize facts without understanding
   B) To develop critical thinking and problem-solving skills
   C) To complete academic requirements only
   D) To impress others with knowledge
   **Correct Answer:** B) To develop critical thinking and problem-solving skills
   **Explanation:** ${topic} helps build analytical skills and practical understanding beyond mere memorization.` };
    case 'quest':
      return { result: {
        story: `You arrive at the Temple of ${topic}, a magnificent structure built from knowledge and wisdom. Ancient runes glow on the walls, each representing a key concept from the source material. A wise sage approaches you, their eyes sparkling with the light of understanding.

"You have come seeking knowledge," the sage says. "But knowledge must be earned through choices that test your understanding. Are you ready to begin your journey?"

As you stand before three glowing portals, each representing a different path of learning, you must choose your approach to mastering ${topic}.`,
        options: ["Enter the Portal of Foundations - Focus on building strong basic concepts first", "Enter the Portal of Applications - Learn through real-world examples and practical scenarios", "Enter the Portal of Integration - Connect different concepts to see the bigger picture"],
        step: 1
      } };
    case 'visual':
      return { result: `graph TD\n  A[${topic}] --> B(Phase 1)\n  A --> C(Phase 2)\n  B --> D{Result}\n  C --> D` };
    case 'podcast':
      return { result: `**Podcast Script: Exploring ${topic}**

Welcome to the Flux Learning Podcast! Today, we're diving deep into ${topic}, a fascinating subject that combines theory with practical applications.

${topic} represents a comprehensive framework for understanding complex concepts. At its core, ${topic} helps us break down intricate ideas into manageable, learnable components. Whether you're a student, professional, or lifelong learner, mastering ${topic} opens up new possibilities for problem-solving and innovation.

One of the most interesting aspects of ${topic} is how it connects theoretical foundations with real-world applications. For example, the principles of ${topic} can be seen in everything from everyday decision-making to complex system design.

As we continue our learning journey, remember that ${topic} is not just about memorizing facts—it's about developing a deep, intuitive understanding that you can apply in countless situations.

Thanks for joining us on the Flux Learning Podcast. Keep exploring, keep learning!` };
    case 'audio':
      return { result: `**Audio Learning Session: ${topic} Fundamentals**

Welcome to your Flux audio learning immersion. Today, we're exploring the fundamentals of ${topic}.

${topic} is a comprehensive field that combines theoretical knowledge with practical applications. Understanding ${topic} helps us make better decisions and solve complex problems in our daily lives and professional work.

The key principles of ${topic} include foundational concepts that build upon each other. By mastering these building blocks, you develop a strong framework for tackling more advanced topics and real-world challenges.

Remember, learning ${topic} is a journey, not a destination. Each concept you master brings you closer to a deeper understanding of how things work and how to apply that knowledge effectively.

Thank you for joining this audio learning session. Continue exploring and building your knowledge base!` };
    default:
      return { result: null, error: "Unknown mode" };
  }
}
