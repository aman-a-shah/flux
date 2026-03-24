import { NextResponse } from "next/server";
import { generateModeContent, ModeId } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const { sessionId, modes, topic, complexity, continueQuest } = reqBody;

    if (!sessionId || !modes || !Array.isArray(modes)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the session to extract file content
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Extract content from notes field (marked with [EXTRACTION_ONLY])
    let extractedContent = '';
    console.log(`[Generate] Session ${sessionId}: notes field length = ${session.notes?.length || 0} chars`);
    if (session.notes) {
      console.log(`[Generate] Session ${sessionId}: notes field preview = "${session.notes.substring(0, 100)}..."`);
    } else {
      console.log(`[Generate] Session ${sessionId}: notes field is NULL`);
    }
    
    if (session.notes && session.notes.includes('[EXTRACTION_ONLY]')) {
      extractedContent = session.notes
        .replace('[EXTRACTION_ONLY]\n', '')
        .replace('\n[END_EXTRACTION_ONLY]', '')
        .replace('[EXTRACTION_ONLY]', '')
        .replace('[END_EXTRACTION_ONLY]', '')
        .trim();
      console.log(`[Generate] ✓ Extracted ${extractedContent.length} chars of content from markers`);
    } else if (session.notes) {
      console.log(`[Generate] ⚠ notes field exists but NO EXTRACTION MARKERS found, content: "${session.notes.substring(0, 200)}..."`);
      extractedContent = session.notes; // Fallback to raw notes
    } else {
      console.log(`[Generate] ⚠ notes field is empty/null - no extracted content available`);
    }

    // Validate complexity level
    const complexityValue = typeof complexity === 'number' ? complexity : 50; // Default complexity

    // Generate content for each mode
    console.log(`[Generate] Starting generation for "${topic}" with ${modes.length} modes and ${extractedContent.length} bytes of context`);
    const results = [];

    for (const mode of modes) {
      try {
        const isContinueQuest = mode === 'quest' && continueQuest;
        const { result, error } = await generateModeContent(mode as ModeId, topic, complexityValue, extractedContent, isContinueQuest ? continueQuest : undefined);

        if (error) {
          console.error(`Generation error for ${mode}: ${error}`);
          results.push({ mode, success: false, error });
          continue;
        }

        if (result) {
          // Update the session with the generated content
          const dbField = (mode === "podcast" || mode === "audio") ? "podcast" : mode;
          let finalResult: string;

          // Handle different result types
          if (typeof result === "object") {
            // Fix for audio element empty src error:
            // If audio generation was skipped/failed, inject a silent audio data URI
            // to prevent the frontend from receiving an undefined audioUrl and falling back to "".
            if ((mode === "podcast" || mode === "audio") && !("audioUrl" in result)) {
              (result as any).audioUrl = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
            }

            // Ensure valid JSON for object results
            try {
              finalResult = JSON.stringify(result);
            } catch (e) {
              console.error(`Failed to stringify ${mode} result:`, e);
              results.push({ mode, success: false, error: "Failed to serialize result" });
              continue;
            }
          } else if (typeof result === "string") {
            finalResult = result;
          } else {
            finalResult = String(result);
          }

          // Update database
          const updateData: Record<string, string> = { [dbField]: finalResult };

          await prisma.session.update({
            where: { id: sessionId },
            data: updateData,
          });
          results.push({ mode, success: true });
        } else {
          results.push({ mode, success: false, error: "No result returned" });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error generating ${mode}:`, error);
        results.push({ mode, success: false, error: errorMsg });
      }
    }
    
    // Return success even if some modes failed (they can retry)
    return NextResponse.json({ 
      message: "Generation completed", 
      results,
      successCount: results.filter(r => r.success).length,
      totalCount: results.length
    });
  } catch (error) {
    console.error("Error in generate API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}