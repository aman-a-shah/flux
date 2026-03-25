import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await req.json();
    
    // We expect the body to contain the field to update, e.g., { notes: "..." } or { flashcards: [...] }
    const updateData: any = {};
    
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    if (body.flashcards !== undefined) {
      updateData.flashcards = typeof body.flashcards === 'string' 
        ? body.flashcards 
        : JSON.stringify(body.flashcards);
    }
    
    if (body.quiz !== undefined) {
      updateData.quiz = typeof body.quiz === 'string' 
        ? body.quiz 
        : JSON.stringify(body.quiz);
    }
    
    if (body.quest !== undefined) {
      updateData.quest = typeof body.quest === 'string' 
        ? body.quest 
        : JSON.stringify(body.quest);
    }
    
    if (body.podcast !== undefined) {
      if (typeof body.podcast === 'object') {
        try {
          updateData.podcast = JSON.stringify(body.podcast);
        } catch (e) {
          console.error('Failed to stringify podcast:', e);
          updateData.podcast = body.podcast; // Fallback to raw if stringification fails
        }
      } else {
        updateData.podcast = body.podcast;
      }
    }
    
    if (body.visual !== undefined) updateData.visual = body.visual;

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
