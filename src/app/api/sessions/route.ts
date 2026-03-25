import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockSessions } from "@/lib/mockData";
import { parseFile } from "@/lib/fileParser";
import { generateSessionTitleAI } from "@/lib/ai";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function generateSessionTitle(extractedContent: string, files: File[], userTitle?: string): Promise<string> {
  // Check if user title is generic/unhelpful
  const genericTitles = [
    'notes', 'note', 'study', 'studying', 'learn', 'learning', 'quiz', 'quizzes', 
    'flashcards', 'flashcard', 'podcast', 'podcasts', 'quest', 'quests', 'game', 'games',
    'visual', 'graph', 'graphs', 'mindmap', 'mind map', 'session', 'sessions',
    'new session', 'new', 'test', 'testing', 'review', 'reviews', 'practice',
    'homework', 'assignment', 'assignments', 'exam', 'exams', 'test', 'tests'
  ];
  
  // Check if title is actually just a filename
  const isFilename = userTitle && (
    userTitle.toLowerCase().endsWith('.pdf') || 
    userTitle.toLowerCase().endsWith('.docx') || 
    userTitle.toLowerCase().endsWith('.doc') || 
    userTitle.toLowerCase().endsWith('.txt') ||
    userTitle.toLowerCase().endsWith('.pptx') ||
    userTitle.toLowerCase().endsWith('.ppt')
  );

  const isGenericTitle = (userTitle && userTitle.trim().length <= 2) || 
    isFilename || (userTitle && userTitle.trim() && 
    genericTitles.some(generic => 
      userTitle.toLowerCase().trim() === generic || 
      userTitle.toLowerCase().trim().includes(generic)
    ));

  // If user provided a non-generic title, use it
  if (userTitle && userTitle.trim() && !isGenericTitle) {
    return userTitle.trim();
  }

  // Use AI to generate a descriptive title based on content
  if (extractedContent.trim().length > 50) {
    return await generateSessionTitleAI(extractedContent);
  }
  
  // Fallback
  return "Study Session";
}

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
      materials: {
        pdfs: s.pdfCount || 0,
        audio: s.audioCount || 0,
        video: s.videoCount || 0,
        image: s.imageCount || 0,
      },
      activeModes: s.activeModes?.split(',').filter(Boolean) || [],
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

    const finalTopic = await generateSessionTitle(extractedContent, files, title);
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
        pdfCount: fileCounts.pdfs,
        audioCount: fileCounts.audio,
        videoCount: fileCounts.video,
        imageCount: fileCounts.image,
        files: JSON.stringify(files.map(f => ({ name: f.name, type: f.type }))),
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

export async function DELETE() {
  try {
    await prisma.session.deleteMany({});
    return NextResponse.json({ message: "All sessions deleted successfully" });
  } catch (error) {
    console.error("Error deleting all sessions:", error);
    return NextResponse.json({ error: "Failed to delete all sessions" }, { status: 500 });
  }
}
