import { NextResponse } from "next/server";
import { generateModeContent, ModeId } from "@/lib/ai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ mode: string }> }) {
  try {
    const { mode } = await params;
    const { topic, complexity, sessionId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    let fileContent = "";
    if (sessionId) {
      const { prisma } = await import("@/lib/prisma");
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { notes: true }
      });
      if (session?.notes) {
        fileContent = session.notes;
      }
    }

    const { result, error } = await generateModeContent(mode as ModeId, topic, complexity || 50, fileContent);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error(`Generation API Error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
