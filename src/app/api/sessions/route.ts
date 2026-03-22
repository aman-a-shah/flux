import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockSessions } from "@/lib/mockData";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    let sessions = await prisma.session.findMany({
      orderBy: { updatedAt: "desc" },
    });

    // Seed if empty
    if (sessions.length === 0) {
      console.log("Seeding mock sessions to database...");
      for (const ms of mockSessions) {
        await prisma.session.create({
          data: {
            title: ms.title,
            date: ms.date,
            lastStudied: ms.lastStudied,
            progress: ms.progress,
            pdfCount: ms.materials.pdfs,
            audioCount: ms.materials.audio,
            videoCount: ms.materials.video,
            imageCount: ms.materials.image,
          },
        });
      }
      sessions = await prisma.session.findMany({
        orderBy: { updatedAt: "desc" },
      });
    }

    // Format for frontend
    const formattedSessions = sessions.map((s: any) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      lastStudied: s.lastStudied,
      progress: s.progress,
      materials: {
        pdfs: s.pdfCount,
        audio: s.audioCount,
        video: s.videoCount,
        image: s.imageCount,
      },
      createdAt: s.createdAt,
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, files, activeModes } = body;

    const newSession = await prisma.session.create({
      data: {
        title: title || "New Session",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        lastStudied: "Just now",
        progress: 0,
        pdfCount: files?.pdfs || 0,
        audioCount: files?.audio || 0,
        videoCount: files?.video || 0,
        imageCount: files?.image || 0,
        activeModes: activeModes && Array.isArray(activeModes) ? activeModes.join(',') : "notes",
      },
    });

    const formattedSession = {
      id: newSession.id,
      title: newSession.title,
      date: newSession.date,
      lastStudied: newSession.lastStudied,
      progress: newSession.progress,
      materials: {
        pdfs: newSession.pdfCount,
        audio: newSession.audioCount,
        video: newSession.videoCount,
        image: newSession.imageCount,
      },
    };

    return NextResponse.json(formattedSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
