import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFile } from "@/lib/fileParser";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await prisma.session.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Format for frontend with proper JSON parsing and fallbacks
    const formattedSession: any = {
      id: session.id,
      title: session.title,
      date: session.date,
      lastStudied: session.lastStudied,
      materials: {
        pdfs: session.pdfCount || 0,
        audio: session.audioCount || 0,
        video: session.videoCount || 0,
        image: session.imageCount || 0,
      },
      activeModes: session.activeModes ? session.activeModes.split(',').filter(Boolean) : [],
      notes: null,
      flashcards: null,
      quiz: null,
      quest: null,
      podcast: null,
      visual: session.visual || null,
      files: session.files ? JSON.parse(session.files) : [],
    };

    // Process notes field - strip internal markers for display
    if (session.notes) {
      // Remove extraction markers to show only generated content
      let notesContent = session.notes
        .replace(/\[EXTRACTION_ONLY\][\s\S]*?\[END_EXTRACTION_ONLY\]\n\n/g, '')
        .replace(/\[EXTRACTION_ONLY\][\s\S]*?\[END_EXTRACTION_ONLY\]/g, '')
        .replace(/\n\n\[GENERATED_NOTES\]\n/g, '')
        .replace(/\n\[END_GENERATED_NOTES\]/g, '')
        .trim();
      
      formattedSession.notes = notesContent || null;
    }

    // Safely parse JSON fields with error handling
    if (session.flashcards) {
      try {
        formattedSession.flashcards = JSON.parse(session.flashcards);
      } catch (e) {
        console.error(`Failed to parse flashcards for session ${resolvedParams.id}:`, e);
        formattedSession.flashcards = session.flashcards; // Return raw if parsing fails
      }
    }

    if (session.quiz) {
      try {
        formattedSession.quiz = JSON.parse(session.quiz);
      } catch (e) {
        console.error(`Failed to parse quiz for session ${resolvedParams.id}:`, e);
        formattedSession.quiz = session.quiz;
      }
    }

    if (session.quest) {
      try {
        formattedSession.quest = JSON.parse(session.quest);
      } catch (e) {
        console.error(`Failed to parse quest for session ${resolvedParams.id}:`, e);
        formattedSession.quest = session.quest;
      }
    }

    if (session.podcast) {
      try {
        // Try to parse as JSON first (for structured podcast data)
        formattedSession.podcast = session.podcast.startsWith('{') ? JSON.parse(session.podcast) : session.podcast;
      } catch (e) {
        console.error(`Failed to parse podcast for session ${resolvedParams.id}:`, e);
        // If parsing fails, return as is (might be plain text or base64)
        formattedSession.podcast = session.podcast;
      }
    }

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Check content type to decide how to parse body
    const contentType = req.headers.get("content-type") || "";
    const updateData: any = {};
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];
      
      if (files.length > 0) {
        // Fetch existing session to append content
        const session = await prisma.session.findUnique({
          where: { id: resolvedParams.id }
        });
        
        if (!session) {
          return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }
        
        let extractedContent = '';
        console.log(`[Sessions PATCH] Processing ${files.length} new files for session ${resolvedParams.id}`);
        for (const file of files) {
          try {
            console.log(`[File Parser] Parsing (PATCH): ${file.name} (${file.type}, ${file.size} bytes)`);
            const parsed = await parseFile(file);
            console.log(`[File Parser] ✓ Parsed ${file.name}: Got ${parsed.content.length} chars of content (type: ${parsed.type})`);
            extractedContent += `\n\n--- ${file.name} (${parsed.type.toUpperCase()}) ---\n${parsed.content}`;
          } catch (error) {
            console.error(`[File Parser] ✗ Error processing file ${file.name}:`, error);
            extractedContent += `\n\n--- ${file.name} (ERROR) ---\n[Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}]`;
          }
        }
        
        // Update file counts
        const pdfCount = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')).length;
        const audioCount = files.filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(f.name)).length;
        const videoCount = files.filter(f => f.type.startsWith('video/') || /\.(mp4|webm|avi|mkv|mov|flv|wmv)$/i.test(f.name)).length;
        const imageCount = files.filter(f => f.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name)).length;
        
        updateData.pdfCount = { increment: pdfCount };
        updateData.audioCount = { increment: audioCount };
        updateData.videoCount = { increment: videoCount };
        updateData.imageCount = { increment: imageCount };
        
        // Update files list
        const existingFiles = session.files ? JSON.parse(session.files) : [];
        const newFiles = files.map(f => ({ name: f.name, type: f.type }));
        updateData.files = JSON.stringify([...existingFiles, ...newFiles]);
        
        // Append to notes
        if (session.notes && session.notes.includes('[END_EXTRACTION_ONLY]')) {
          updateData.notes = session.notes.replace('[END_EXTRACTION_ONLY]', `${extractedContent}\n[END_EXTRACTION_ONLY]`);
        } else if (session.notes) {
          updateData.notes = session.notes + extractedContent;
        } else {
          updateData.notes = `[EXTRACTION_ONLY]${extractedContent}\n[END_EXTRACTION_ONLY]`;
        }
      }
    } else {
      const body = await req.json();
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.flashcards !== undefined) {
        updateData.flashcards = typeof body.flashcards === 'string' ? body.flashcards : JSON.stringify(body.flashcards);
      }
      if (body.quiz !== undefined) {
        updateData.quiz = typeof body.quiz === 'string' ? body.quiz : JSON.stringify(body.quiz);
      }
      if (body.quest !== undefined) {
        updateData.quest = typeof body.quest === 'string' ? body.quest : JSON.stringify(body.quest);
      }
      if (body.podcast !== undefined) {
        if (typeof body.podcast === 'object') {
          try {
            updateData.podcast = JSON.stringify(body.podcast);
          } catch (e) {
            console.error('Failed to stringify podcast:', e);
            updateData.podcast = body.podcast;
          }
        } else {
          updateData.podcast = body.podcast;
        }
      }
      if (body.visual !== undefined) updateData.visual = body.visual;
    }

    const updatedSession = await prisma.session.update({
      where: { id: resolvedParams.id },
      data: updateData
    });

    return NextResponse.json({ success: true, id: updatedSession.id });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.session.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
