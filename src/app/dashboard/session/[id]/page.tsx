"use client";

import { useEffect, useState, use } from "react";
import { useAppStore } from "@/lib/store";
import { ModeSelector } from "@/components/modes/ModeSelector";
import { Slider } from "@/components/ui/slider";
import { Brain, FileText, Download, Share, Zap, Volume2, Gamepad2, Network, Layers, CheckSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { activeMode, preferences, setPreferences, setActiveSession } = useAppStore();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setActiveSession(resolvedParams.id);
    fetchSession();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (activeMode === "notes" && session && !notes && !generating) {
      generateNotes();
    }
  }, [activeMode, session, preferences.complexity]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateNotes = async () => {
    if (!session) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: session.title, 
          complexity: preferences.complexity 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="flex justify-center h-[calc(100vh-64px)] overflow-hidden">
      <div className="w-full max-w-5xl px-8 flex flex-col h-full">
        <div className="pt-8 pb-4 shrink-0">
          <ModeSelector />
        </div>

        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide p-1">
          {activeMode === "notes" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-sans tracking-tight text-zinc-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  Smart Notes
                </h2>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="h-8 border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm">
                    <Download className="w-4 h-4 mr-2" /> Export
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm" onClick={generateNotes}>
                    <Zap className="w-4 h-4 mr-2" /> Regenerate
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-4 mb-8 flex items-center gap-6 border border-zinc-200 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/50">
                  <Brain className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-zinc-700">Explanation Complexity</div>
                    <div className="text-xs font-mono text-indigo-600 font-semibold">{preferences.complexity}%</div>
                  </div>
                  <Slider 
                    value={[preferences.complexity]} 
                    onValueChange={(val) => setPreferences({ complexity: (val as number[])[0] })}
                    max={100} 
                    step={1} 
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1.5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    <span>Explain like I&apos;m 5</span>
                    <span>Post-Grad</span>
                  </div>
                </div>
              </div>

              {generating ? (
                <div className="flex flex-col items-center justify-center p-20 border border-zinc-200 rounded-[24px] bg-white shadow-sm gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium text-zinc-500 animate-pulse">Synthesizing notes via Gemini...</p>
                </div>
              ) : (
                <div className="prose prose-zinc max-w-none bg-white border border-zinc-200 rounded-[24px] p-8 shadow-sm relative">
                  <div className="absolute top-0 right-8 px-3 py-1 bg-zinc-50 border border-zinc-200 border-t-0 text-zinc-500 text-[10px] font-mono rounded-b-lg flex items-center gap-1.5 shadow-sm">
                    <Zap className="w-3 h-3 fill-amber-400 text-amber-400" /> Generated by Gemini
                  </div>
                  <div className="mt-4">
                    {notes ? (
                      <ReactMarkdown>{notes}</ReactMarkdown>
                    ) : (
                      <p className="text-zinc-500 font-medium">No notes available. Adjust settings to generate.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMode === "audio" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 h-[60vh] flex flex-col items-center justify-center border border-zinc-200 rounded-[32px] bg-white shadow-sm">
               <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center mb-6 border border-violet-100">
                 <Volume2 className="w-10 h-10 text-violet-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2">Audio Immersion Draft</h3>
               <p className="text-zinc-500 max-w-sm text-center">Podcast-style discussion generated via Voice AI based on your session materials.</p>
               <Button className="mt-8 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium">Play Summary (14:20)</Button>
             </div>
          )}

          {activeMode === "quest" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 h-[60vh] flex flex-col items-center justify-center border border-zinc-200 rounded-[32px] bg-white shadow-sm">
               <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6 border border-amber-100">
                 <Gamepad2 className="w-10 h-10 text-amber-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2">Ready to Play?</h3>
               <p className="text-zinc-500 max-w-sm text-center">Embark on a 5-minute gamified challenge covering {session.title}.</p>
               <Button className="mt-8 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium">Start Quest</Button>
             </div>
          )}

          {activeMode === "visual" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 h-[60vh] flex flex-col items-center justify-center border border-zinc-200 rounded-[32px] bg-white shadow-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('/dots.svg')] opacity-5" />
               <div className="w-20 h-20 rounded-full bg-cyan-50 flex items-center justify-center mb-6 border border-cyan-100 relative z-10">
                 <Network className="w-10 h-10 text-cyan-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2 relative z-10">Interactive Knowledge Graph</h3>
               <p className="text-zinc-500 max-w-sm text-center relative z-10">Explore the concept map generated by Flux&apos;s Graph engine.</p>
               <Button variant="outline" className="mt-8 border-zinc-200 shadow-sm text-zinc-700 hover:bg-zinc-50 bg-white rounded-full px-8 relative z-10">Open Immersive View</Button>
             </div>
          )}

          {activeMode === "flashcards" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 h-[60vh] flex flex-col items-center justify-center border border-zinc-200 rounded-[32px] bg-white shadow-sm">
               <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100">
                 <Layers className="w-10 h-10 text-emerald-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2">Spaced Repetition Deck</h3>
               <p className="text-zinc-500 max-w-sm text-center">42 cards generated. 15 due for review today.</p>
               <Button className="mt-8 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium">Review Now</Button>
             </div>
          )}

          {activeMode === "quiz" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 h-[60vh] flex flex-col items-center justify-center border border-zinc-200 rounded-[32px] bg-white shadow-sm">
               <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
                 <CheckSquare className="w-10 h-10 text-rose-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2">Test Knowledge</h3>
               <p className="text-zinc-500 max-w-sm text-center">Take a dynamic 10-question quiz tailored to your mastery level.</p>
               <Button className="mt-8 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium">Start Quiz</Button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
