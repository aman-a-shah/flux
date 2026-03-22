import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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
      }
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
