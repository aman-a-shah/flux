import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockSessions } from "@/lib/mockData";
import * as pdfParse from 'pdf-parse';

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
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const activeModesStr = formData.get('activeModes') as string;
    const activeModes = activeModesStr ? JSON.parse(activeModesStr) : ["notes"];

    const modesToGenerate = activeModes && Array.isArray(activeModes) ? activeModes : ["notes"];

    // Process uploaded files
    const files = formData.getAll('files') as File[];
    let extractedContent = '';

    // Extract text from uploaded files
    for (const file of files) {
      if (file.type === 'application/pdf') {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const pdfData = await pdfParse(buffer);
          extractedContent += `\n\n--- PDF: ${file.name} ---\n${pdfData.text}`;
        } catch (error) {
          console.error(`Error parsing PDF ${file.name}:`, error);
          extractedContent += `\n\n--- PDF: ${file.name} (Error parsing) ---`;
        }
      } else if (file.type.startsWith('text/')) {
        try {
          const text = await file.text();
          extractedContent += `\n\n--- Text File: ${file.name} ---\n${text}`;
        } catch (error) {
          console.error(`Error reading text file ${file.name}:`, error);
          extractedContent += `\n\n--- Text File: ${file.name} (Error reading) ---`;
        }
      }
      // TODO: Add support for other file types (images with OCR, audio transcription, etc.)
    }

    // Count file types
    const fileCounts = {
      pdfs: files.filter(f => f.type === 'application/pdf').length,
      audio: files.filter(f => f.type.startsWith('audio/')).length,
      video: files.filter(f => f.type.startsWith('video/')).length,
      image: files.filter(f => f.type.startsWith('image/')).length
    };

    const finalTopic = title || (files.length > 0 ? files[0].name : "New Session");

    // 1. Create the session base
    const newSession = await prisma.session.create({
      data: {
        title: finalTopic,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        lastStudied: "Just now",
        progress: 0,
        pdfCount: fileCounts.pdfs,
        audioCount: fileCounts.audio,
        videoCount: fileCounts.video,
        imageCount: fileCounts.image,
        activeModes: modesToGenerate.join(','),
        notes: extractedContent, // Store file content in notes field temporarily
      },
    });

    // Return session info for loading page (generation will happen separately)
    const formattedSession = {
      id: newSession.id,
      title: newSession.title,
      modes: modesToGenerate,
      topic: finalTopic,
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
