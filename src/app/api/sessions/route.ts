import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockSessions } from "@/lib/mockData";
import { parseFile } from "@/lib/fileParser";

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
      activeModes: s.activeModes?.split(',') || [],
      createdAt: s.createdAt,
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

// Temporary storage for extracted content during session creation
const extractedContentMap = new Map<string, string>();

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

    // Process each file based on type
    console.log(`[Sessions POST] Processing ${files.length} files`);
    for (const file of files) {
      try {
        console.log(`[File Parser] Parsing: ${file.name} (${file.type}, ${file.size} bytes)`);
        const parsed = await parseFile(file);
        console.log(`[File Parser] ✓ Parsed ${file.name}: Got ${parsed.content.length} chars of content (type: ${parsed.type})`);
        extractedContent += `\n\n--- ${file.name} (${parsed.type.toUpperCase()}) ---\n${parsed.content}`;
      } catch (error) {
        console.error(`[File Parser] ✗ Error processing file ${file.name}:`, error);
        extractedContent += `\n\n--- ${file.name} (ERROR) ---\n[Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}]`;
      }
    }

    // Count file types
    const fileCounts = {
      pdfs: files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')).length,
      audio: files.filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(f.name)).length,
      video: files.filter(f => f.type.startsWith('video/') || /\.(mp4|webm|avi|mkv|mov|flv|wmv)$/i.test(f.name)).length,
      image: files.filter(f => f.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name)).length
    };

    const finalTopic = title || (files.length > 0 ? files[0].name : "New Session");

    console.log(`[Sessions POST] Total extracted content: ${extractedContent.length} chars`);
    console.log(`[Sessions POST] Files processed: PDFs=${fileCounts.pdfs}, Audio=${fileCounts.audio}, Video=${fileCounts.video}, Images=${fileCounts.image}`);
    
    // 1. Create the session base WITH extracted content in notes field for now
    // (marked so we can distinguish it from generated notes)
    const notesContent = extractedContent.trim() ? `[EXTRACTION_ONLY]\n${extractedContent}\n[END_EXTRACTION_ONLY]` : null;
    console.log(`[Sessions POST] Storing in notes field: ${notesContent ? notesContent.length : 0} chars`);
    
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
        // Store extracted content with clear markers so we can distinguish from generated notes
        notes: notesContent,
      },
    });

    console.log(`[Sessions POST] ✓ Session ${newSession.id} created with modes: ${modesToGenerate.join(', ')}`);

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
