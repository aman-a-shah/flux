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

  try {
    if (isMock) {
      console.log(`[AI.${mode}] Using mock mode for ${mode} (Key missing or dummy)`);
      return generateMockContent(mode, topic, fileContent);
    }

    console.log(`[AI.${mode}] Making API call to Gemini...`);
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
        console.log(`[AI.${mode}] Included ${cleanedContent.length} chars of source material in prompt`);
      }
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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
        userPrompt = `Create a comprehensive set of 8-10 flashcards based on the source material.

REQUIREMENTS:
1. **Coverage**: Select the most important concepts, definitions, formulas, and practical applications
2. **Balance**: Mix concept questions with application questions for deeper learning
3. **Clarity**: Front should be a clear, concise question. Back should be complete but concise answer
4. **Formatting**: 
   - Use markdown formatting in answers (bold for key terms, code blocks for technical content, bullet points for lists)
   - Include examples or mnemonics where helpful
5. **Difficulty**: Progress from foundational to more advanced concepts

Format as a numbered list of flashcards:
1. **Front:** Question text
   **Back:** Answer with **bold** for key terms, bullets, code blocks as needed

2. **Front:** Question text  
   **Back:** Answer text

Continue this format for all flashcards.`;
        break;

      case 'quiz':
        userPrompt = `Create a 5-question multiple choice quiz that tests understanding of the source material.

REQUIREMENTS:
1. **Coverage**: Mix recall questions with comprehension and application questions
2. **Quality**: 
   - Each option should be plausible (avoid obviously wrong answers)
   - Explanations should clarify why the correct answer is right and why others are wrong
   - Include edge cases or common misconceptions in distractors
3. **Difficulty**: Progress from easier to more challenging questions
4. **Educational Value**: Explanations should deepen learning, not just confirm the answer

Format as a numbered list:
1. **Question:** Question text
   **Options:**
   A) Option A
   B) Option B  
   C) Option C
   D) Option D
   **Correct Answer:** A) Option A
   **Explanation:** Clear explanation of why this answer is correct

2. **Question:** Question text
   etc.`;
        break;

      case 'quest':
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

Format the response as a complete story scenario with the initial setup and 3 clear choice options at the end.`;
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
        userPrompt = `Create a podcast script about "${topic}" based on the source material.

Write a 1-2 minute podcast script (roughly 150-300 words) that covers the key concepts from the material. The script should be engaging and conversational, like a real podcast episode.

Format:
**Podcast Script: [Episode Title]**

[Host introduction and main content - write in spoken word style, conversational tone]

[Key takeaways or conclusion]

Make it educational but entertaining, with smooth transitions between topics.`;
        break;

      case 'audio':
        // Audio is an alias for podcast
        userPrompt = `Create a podcast script about "${topic}" based on the source material.

Write a 1-2 minute podcast script (roughly 150-300 words) that covers the key concepts from the material. The script should be engaging and conversational, like a real podcast episode.

Format:
**Podcast Script: [Episode Title]**

[Host introduction and main content - write in spoken word style, conversational tone]

[Key takeaways or conclusion]

Make it educational but entertaining, with smooth transitions between topics.`;
        break;

      default:
        return { result: null, error: "Invalid mode" };
    }

    const completion = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
    });

    const raw = completion.response.text() || "";
    
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
      return { result: `You arrive at the Temple of ${topic}, a magnificent structure built from knowledge and wisdom. Ancient runes glow on the walls, each representing a key concept from the source material. A wise sage approaches you, their eyes sparkling with the light of understanding.

"You have come seeking knowledge," the sage says. "But knowledge must be earned through choices that test your understanding. Are you ready to begin your journey?"

As you stand before three glowing portals, each representing a different path of learning, you must choose your approach to mastering ${topic}.

**Choice 1:** Enter the Portal of Foundations - Focus on building strong basic concepts first
**Choice 2:** Enter the Portal of Applications - Learn through real-world examples and practical scenarios  
**Choice 3:** Enter the Portal of Integration - Connect different concepts to see the bigger picture` };
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
