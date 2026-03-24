import { NextResponse } from "next/server";
import { generateModeContent, ModeId } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { sessionId, modes, topic } = await request.json();

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
      console.log(`[Generate] ⚠ notes field exists but NO EXTRACTION MARKERS found`);
    } else {
      console.log(`[Generate] ⚠ notes field is empty/null - no extracted content available`);
    }

    // Validate complexity level
    const complexity = 50; // Default complexity

    // Generate content for each mode in parallel
    console.log(`[Generate] Starting generation for "${topic}" with ${modes.length} modes and ${extractedContent.length} bytes of context`);
    const generationPromises = modes.map(async (mode: string) => {
      try {
        const { result, error } = await generateModeContent(mode as ModeId, topic, complexity, extractedContent);
        
        if (error) {
          console.error(`Generation error for ${mode}: ${error}`);
          return { mode, success: false, error };
        }

        if (result) {
          // Update the session with the generated content
          const dbField = (mode === "podcast" || mode === "audio") ? "podcast" : mode;
          let finalResult: string;

          // Handle different result types
          if (typeof result === "object") {
            // Ensure valid JSON for object results
            try {
              finalResult = JSON.stringify(result);
            } catch (e) {
              console.error(`Failed to stringify ${mode} result:`, e);
              return { mode, success: false, error: "Failed to serialize result" };
            }
          } else if (typeof result === "string") {
            finalResult = result;
          } else {
            finalResult = String(result);
          }

          // Update database
          const updateData: any = { [dbField]: finalResult };
          
          // IMPORTANT: For notes mode, preserve extraction markers in the notes field
          // This ensures that subsequent calls (retry, polling, other modes) can still access the original file content
          if (mode === 'notes' && session.notes?.includes('[EXTRACTION_ONLY]')) {
            // Keep extraction markers and append generated content with clear delimiters
            const extractionSection = session.notes.substring(
              session.notes.indexOf('[EXTRACTION_ONLY]'),
              session.notes.indexOf('[END_EXTRACTION_ONLY]') + '[END_EXTRACTION_ONLY]'.length
            );
            updateData.notes = extractionSection + '\n\n[GENERATED_NOTES]\n' + finalResult + '\n[END_GENERATED_NOTES]';
            console.log(`[Generate] Preserving extraction markers and appending generated notes`);
          }

          await prisma.session.update({
            where: { id: sessionId },
            data: updateData,
          });
          
          console.log(`Successfully generated ${mode} for session ${sessionId}`);
          return { mode, success: true };
        }

        return { mode, success: false, error: "No result returned" };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error generating ${mode}:`, error);
        return { mode, success: false, error: errorMsg };
      }
    });

    // Wait for all generations to complete
    const results = await Promise.all(generationPromises);
    
    // Log results for debugging
    results.forEach(result => {
      if (!result.success) {
        console.warn(`Generation failed for ${result.mode}: ${result.error}`);
      }
    });

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