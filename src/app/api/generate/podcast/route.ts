import { NextResponse } from "next/server";
import { generateModeContent } from "@/lib/ai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { topic, complexity } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const { result, error } = await generateModeContent("podcast", topic, complexity || 50);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ result });

  } catch (error: any) {
    console.error("Podcast Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate podcast" },
      { status: 500 }
    );
  }
}
