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

    // Use stored file content from notes field
    const extractedContent = session.notes || "";

    // Generate content for each mode in parallel
    const generationPromises = modes.map(async (mode: string) => {
      try {
        const { result, error } = await generateModeContent(mode as ModeId, topic, 50, extractedContent);
        if (result && !error) {
          // Update the session with the generated content
          const dbField = mode === "podcast" ? "podcast" : mode;
          await prisma.session.update({
            where: { id: sessionId },
            data: { [dbField]: result },
          });
          return { mode, success: true };
        }
        return { mode, success: false, error };
      } catch (error) {
        console.error(`Error generating ${mode}:`, error);
        return { mode, success: false, error: error.message };
      }
    });

    // Start all generations asynchronously
    Promise.all(generationPromises).catch(error => {
      console.error("Error in parallel generation:", error);
    });

    return NextResponse.json({ message: "Generation started" });
  } catch (error) {
    console.error("Error in generate API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}