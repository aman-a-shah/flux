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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setActiveSession(resolvedParams.id);
    fetchSession();
  }, [resolvedParams.id]);

  useEffect(() => {
    // Automatically trigger generation for the active mode if it hasn't been generated yet
    if (session && !session[activeMode] && !generating) {
      generateContent(activeMode);
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

  const generateContent = async (mode: string) => {
    if (!session) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/generate/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: session.title, 
          complexity: preferences.complexity 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const result = data.result;
        
        // Update local React state so UI updates
        setSession((prev: any) => ({ ...prev, [mode]: result }));
        
        // Persist to DB securely in SQLite
        await fetch(`/api/sessions/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [mode]: result })
        });
      }
    } catch (error) {
      console.error(`Error generating ${mode}:`, error);
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

  // Helper renderer to pass generating state cleanly
  const renderGeneratingState = (modeName: string) => (
    <div className="flex flex-col items-center justify-center p-20 border border-zinc-200 rounded-[24px] bg-white shadow-sm gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-sm font-medium text-zinc-500 animate-pulse">Synthesizing {modeName} via Deepseek...</p>
    </div>
  );

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
                  <Button variant="outline" size="sm" className="h-8 border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm" onClick={() => generateContent("notes")}>
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

              {generating && !session.notes ? (
                renderGeneratingState("notes")
              ) : (
                <div className="prose prose-zinc max-w-none bg-white border border-zinc-200 rounded-[24px] p-8 shadow-sm relative">
                  <div className="absolute top-0 right-8 px-3 py-1 bg-zinc-50 border border-zinc-200 border-t-0 text-zinc-500 text-[10px] font-mono rounded-b-lg flex items-center gap-1.5 shadow-sm">
                    <Zap className="w-3 h-3 fill-amber-400 text-amber-400" /> Generated by Deepseek
                  </div>
                  <div className="mt-4">
                    {session.notes ? (
                      <ReactMarkdown>{session.notes}</ReactMarkdown>
                    ) : (
                      <p className="text-zinc-500 font-medium">No notes available. Adjust settings to generate.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMode === "audio" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-zinc-200 rounded-[32px] bg-white shadow-sm overflow-hidden p-8">
               <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mb-6 border border-violet-100">
                 <Volume2 className="w-8 h-8 text-violet-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2">Podcast Generation</h3>
               <p className="text-zinc-500 mb-8 max-w-md">Listen to a custom generated synthesis of <strong>{session.title}</strong>, powered by ElevenLabs voice synthesis.</p>
               
               {generating && !session.podcast ? (
                 renderGeneratingState("podcast audio")
               ) : session.podcast ? (
                 <div className="w-full py-6">
                   <p className="text-xs text-zinc-400 font-mono uppercase mb-3">Audio Ready</p>
                   <audio controls className="w-full h-12 bg-zinc-50 rounded-full" src={session.podcast.audioUrl || session.podcast} />
                   {session.podcast.script && (
                     <div className="mt-8 pt-8 border-t border-zinc-100">
                        <h4 className="font-semibold text-zinc-700 mb-4">Live Transcript</h4>
                        <div className="prose prose-sm text-zinc-600">
                          {session.podcast.script}
                        </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <Button onClick={() => generateContent("podcast")} className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium w-max">
                   Generate Educational Podcast
                 </Button>
               )}
             </div>
          )}

          {activeMode === "flashcards" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-zinc-200 rounded-[32px] bg-white shadow-sm p-8 min-h-[60vh]">
               <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100">
                 <Layers className="w-8 h-8 text-emerald-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2">Spaced Repetition Deck</h3>
               
               {generating && !session.flashcards ? (
                 renderGeneratingState("flashcard deck")
               ) : session.flashcards ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {session.flashcards.flashcards?.map((card: any, idx: number) => (
                      <div key={idx} className="group relative w-full h-48 [perspective:1000px] cursor-pointer">
                        <div className="absolute inset-0 w-full h-full duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-sm rounded-xl">
                          <div className="absolute inset-0 w-full h-full bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center p-6 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] [backface-visibility:hidden]">
                            <p className="font-medium text-zinc-800">{card.front}</p>
                            <span className="absolute bottom-3 right-4 text-[10px] text-zinc-400 font-mono tracking-widest uppercase">Flip to reveal</span>
                          </div>
                          <div className="absolute inset-0 w-full h-full bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-center p-6 text-center text-emerald-900 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                            <p className="font-medium">{card.back}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <Button onClick={() => generateContent("flashcards")} className="mt-4 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium w-max">
                   Generate Flashcards
                 </Button>
               )}
             </div>
          )}

          {activeMode === "quiz" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-zinc-200 rounded-[32px] bg-white shadow-sm p-8 min-h-[60vh]">
               <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
                 <CheckSquare className="w-8 h-8 text-rose-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2">Test Knowledge</h3>
               
               {generating && !session.quiz ? (
                 renderGeneratingState("dynamic quiz")
               ) : session.quiz ? (
                 <div className="mt-6 flex flex-col gap-8 w-full max-w-2xl">
                    {session.quiz.quiz?.map((q: any, i: number) => (
                      <div key={i} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200">
                        <h4 className="font-semibold text-zinc-800 mb-4">{i + 1}. {q.question}</h4>
                        <div className="flex flex-col gap-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <button key={optIdx} className="text-left px-4 py-3 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-sm text-zinc-700">
                              <span className="font-mono text-xs text-zinc-400 mr-3">{String.fromCharCode(65 + optIdx)}</span>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <Button onClick={() => generateContent("quiz")} className="mt-4 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium w-max">
                   Generate Quiz
                 </Button>
               )}
             </div>
          )}

          {activeMode === "quest" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center border border-zinc-200 rounded-[32px] bg-white shadow-sm p-8 min-h-[60vh]">
               <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6 border border-amber-100">
                 <Gamepad2 className="w-8 h-8 text-amber-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2">Ready to Play?</h3>
               
               {generating && !session.quest ? (
                 renderGeneratingState("interactive quest")
               ) : session.quest ? (
                 <div className="w-full max-w-xl mx-auto flex flex-col items-center mt-6">
                    <p className="text-lg text-zinc-700 text-center leading-relaxed mb-10">{session.quest.story}</p>
                    <div className="flex flex-col gap-3 w-full">
                      {session.quest.options?.map((opt: string, i: number) => (
                        <button key={i} className="w-full px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl text-left border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm">
                          {opt}
                        </button>
                      ))}
                    </div>
                 </div>
               ) : (
                 <Button onClick={() => generateContent("quest")} className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium">
                   Start Gamified Quest
                 </Button>
               )}
             </div>
          )}

          {activeMode === "visual" && (
             <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-zinc-200 rounded-[32px] bg-white shadow-sm p-8 min-h-[60vh] relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('/dots.svg')] opacity-5" />
               <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-6 border border-cyan-100 relative z-10">
                 <Network className="w-8 h-8 text-cyan-500" />
               </div>
               <h3 className="text-2xl font-bold text-zinc-900 mb-2 relative z-10">Interactive Knowledge Graph</h3>
               
               {generating && !session.visual ? (
                 renderGeneratingState("semantic graph mapping")
               ) : session.visual ? (
                 <div className="w-full h-full min-h-[400px] mt-6 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 font-mono text-sm text-zinc-600 overflow-auto mix-blend-multiply relative z-10 shadow-inner">
                    <pre><code>{session.visual.replace(/```mermaid/g, '').replace(/```/g, '')}</code></pre>
                 </div>
               ) : (
                 <Button onClick={() => generateContent("visual")} className="mt-4 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium relative z-10 w-max">
                   Generate Dependencies
                 </Button>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
