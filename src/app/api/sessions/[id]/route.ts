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

    // Format for frontend
    const formattedSession = {
      id: session.id,
      title: session.title,
      date: session.date,
      lastStudied: session.lastStudied,
      progress: session.progress,
      materials: {
        pdfs: session.pdfCount,
        audio: session.audioCount,
        video: session.videoCount,
        image: session.imageCount,
      },
      activeModes: session.activeModes ? session.activeModes.split(',') : [],
      notes: session.notes || null,
      flashcards: session.flashcards ? JSON.parse(session.flashcards) : null,
      quiz: session.quiz ? JSON.parse(session.quiz) : null,
      quest: session.quest ? JSON.parse(session.quest) : null,
      podcast: session.podcast || null,
      visual: session.visual || null,
    };

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
    if (body.flashcards !== undefined) updateData.flashcards = JSON.stringify(body.flashcards);
    if (body.quiz !== undefined) updateData.quiz = JSON.stringify(body.quiz);
    if (body.quest !== undefined) updateData.quest = JSON.stringify(body.quest);
    if (body.podcast !== undefined) updateData.podcast = body.podcast;
    if (body.visual !== undefined) updateData.visual = body.visual;
    if (body.progress !== undefined) updateData.progress = body.progress;

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
