"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore, Session } from "@/lib/store";
import { ModeId } from "@/lib/ai";
import { ModeSelector } from "@/components/modes/ModeSelector";
import { NotesDisplay } from "@/components/NotesDisplay";
import { MindMap } from "@/components/MindMap";
import { cn } from "@/lib/utils";
import { Brain, FileText, Zap, Volume2, Gamepad2, Network, Layers, CheckSquare, Loader2, MessageSquare, Folder, FileStack, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const { activeMode, preferences, setActiveSession, setActiveMode } = useAppStore();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tweakPrompt, setTweakPrompt] = useState("");
  const [failedModes, setFailedModes] = useState<Record<string, boolean>>({});

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        
        // Ensure complex modes are parsed from JSON string if needed
        ['flashcards', 'quiz', 'quest', 'visual'].forEach(key => {
          if (data[key] && typeof data[key] === 'string') {
            try {
              const trimmed = data[key].trim();
              // Only try parsing if it looks like a JSON object or array
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                data[key] = JSON.parse(data[key]);
              }
            } catch (e) {
              console.warn(`Failed to parse ${key} JSON`, e);
            }
          }
        });

        setSession(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    setActiveSession(resolvedParams.id);
    fetchSession();
  }, [resolvedParams.id, fetchSession, setActiveSession]);

  useEffect(() => {
    if (!session || generating) return;

    // If activeMode is not among selected active modes, switch to first selected one
    if (session.activeModes && session.activeModes.length > 0 && !session.activeModes.includes(activeMode)) {
      const firstMode = session.activeModes[0];
      if (typeof firstMode === 'string') {
        setActiveMode(firstMode as ModeId);
      }
    }

    const selectedModes = session.activeModes && session.activeModes.length > 0 ? session.activeModes : ['notes'];
    const pendingModes = selectedModes.filter((mode: string) => !isModeComplete(mode, session) && !failedModes[mode]);

    if (pendingModes.length > 0 && !view) {
      generateContent(pendingModes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, session, preferences.complexity, view, generating, failedModes, setActiveMode]);

  const generateContent = async (modeOrModes: string | string[]) => {
    if (!session) return;
    setGenerating(true);

    const modes = Array.isArray(modeOrModes) ? modeOrModes : [modeOrModes];
    if (modes.length === 0) {
      setGenerating(false);
      return;
    }

    try {
      const res = await fetch(`/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          modes,
          topic: session.title,
          complexity: preferences.complexity,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        modes.forEach(m => setFailedModes(prev => ({ ...prev, [m]: true })));
        console.error(`Failed to generate ${modes.join(', ')}:`, err);
      } else {
        // refresh everything from db so UI gets latest structures (notes, arrays, objects)
        await fetchSession();
        modes.forEach(m => setFailedModes(prev => ({ ...prev, [m]: false })));
      }
    } catch (error) {
      console.error(`Error generating ${modes.join(', ')}:`, error);
      modes.forEach(m => setFailedModes(prev => ({ ...prev, [m]: true })));
    } finally {
      setGenerating(false);
    }
  };

  const renderGeneratingState = (modeName: string) => (
    <div className="flex flex-col items-center justify-center p-20 border border-zinc-200 rounded-[24px] bg-white shadow-sm gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-sm font-medium text-zinc-500 animate-pulse">Synthesizing {modeName} via Gemini...</p>
    </div>
  );

  const isModeComplete = (mode: string, sessionData?: Session | null) => {
    if (!sessionData) return false;
    switch (mode) {
      case 'notes':
        return typeof sessionData.notes === 'string' && sessionData.notes.length > 0;
      case 'flashcards': {
        const flash = sessionData.flashcards;
        if (Array.isArray(flash)) return flash.length > 0;
        if (flash && typeof flash === 'object' && 'flashcards' in flash) {
          const nested = (flash as { flashcards?: unknown }).flashcards;
          return Array.isArray(nested) && nested.length > 0;
        }
        if (typeof flash === 'string') return flash.length > 0;
        return false;
      }
      case 'quiz': {
        const q = sessionData.quiz;
        if (Array.isArray(q)) return q.length > 0;
        if (q && typeof q === 'object' && 'quiz' in q) {
          const nested = (q as { quiz?: unknown }).quiz;
          return Array.isArray(nested) && nested.length > 0;
        }
        if (typeof q === 'string') return q.length > 0;
        return false;
      }
      case 'quest':
        return !!(sessionData.quest && (typeof sessionData.quest === 'object' || typeof sessionData.quest === 'string'));
      case 'podcast':
      case 'audio':
        return !!(sessionData.podcast && (typeof sessionData.podcast === 'object' || typeof sessionData.podcast === 'string'));
      case 'visual':
                return !!(sessionData.visual && (typeof sessionData.visual === 'object' || typeof sessionData.visual === 'string'));

      default:
        return false;
    }
  };

  const renderFilesView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
          <Folder className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 leading-tight">Session Materials</h2>
          <p className="text-sm text-zinc-500 font-mono">Manage and view your source documents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: FileStack, label: "PDFs", count: session?.materials?.pdfs || 0, color: "text-indigo-500", bg: "bg-indigo-50" },
          { icon: Volume2, label: "Audio", count: session?.materials?.audio || 0, color: "text-violet-500", bg: "bg-violet-50" },
          { icon: Volume2, label: "Video", count: session?.materials?.video || 0, color: "text-cyan-500", bg: "bg-cyan-50" },
          { icon: FileText, label: "Images", count: session?.materials?.image || 0, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", item.bg)}>
                <item.icon className={cn("w-6 h-6", item.color)} />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">{item.label}</h4>
                <p className="text-xs text-zinc-500 font-mono">{item.count} files attached</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-zinc-400 group-hover:text-indigo-600">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100 shadow-sm">
          <MessageSquare className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 leading-tight">Tweak Study Session</h2>
          <p className="text-sm text-zinc-500 font-mono">Talk to Flux to refine your materials</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end gap-6 h-full min-h-[400px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="flex items-start gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
              <Brain className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-sm text-zinc-700 leading-relaxed">
              Hey there! How can I help you refine this session? I can make the notes more technical, add more real-world examples to the quiz, or simplify specific concepts.
            </div>
          </div>
        </div>

        <div className="relative group shrink-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl blur opacity-[0.05] group-focus-within:opacity-20 transition duration-500" />
          <div className="relative bg-white border border-zinc-200 rounded-2xl p-2 shadow-sm focus-within:border-indigo-300 focus-within:shadow-md transition-all flex items-center">
            <input 
              value={tweakPrompt}
              onChange={(e) => setTweakPrompt(e.target.value)}
              placeholder="Ask Flux to modify your session..." 
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none placeholder:text-zinc-400" 
            />
            <Button size="icon" className="bg-zinc-900 rounded-xl hover:bg-zinc-800 shrink-0">
              <ArrowRight className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading || !session) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="flex justify-center h-[calc(100vh-64px)] overflow-hidden relative">
      <div className="w-full max-w-5xl px-8 flex flex-col h-full bg-transparent z-10">
        {!view && (
          <div className="pt-8 pb-4 shrink-0">
            <ModeSelector activeModes={session.activeModes} />
          </div>
        )}

        <div className="flex-1 overflow-hidden p-1 flex flex-col">
          {view === "files" ? (
            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
              {renderFilesView()}
            </div>
          ) : view === "chat" ? renderChatView() : (
            <>
              {activeMode === "notes" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6 shrink-0">
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

                {/*}
                  <div className="bg-white rounded-[20px] p-4 mb-8 flex items-center gap-6 border border-zinc-200 shadow-sm relative z-20">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/50">
                      <Brain className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-zinc-700">Explanation Complexity</div>
                        <div className="text-xs font-mono text-indigo-600 font-semibold">{preferences.complexity}%</div>
                      </div>
                      <Slider 
                        value={[preferences?.complexity ?? 50]} 
                        onValueChange={(val) => {
                          if (Array.isArray(val) && val.length > 0) {
                            setPreferences({ complexity: val[0] });
                          }
                        }}
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
                  */}

                  <div className="flex-1 overflow-y-auto pb-24 pr-2 mb-6">
                  {generating || (session.notes && session.notes.includes("[RAW_EXTRACTION_BEGIN]")) ? (
                    renderGeneratingState("notes")
                  ) : (
                    <div className="relative">
                      <div className="absolute top-8 right-8 px-3 py-1 bg-zinc-50 border border-zinc-200 text-zinc-500 text-[10px] font-mono rounded-lg flex items-center gap-1.5 shadow-sm z-10">
                        <Zap className="w-3 h-3 fill-amber-400 text-amber-400" /> Generated by Cerebras
                      </div>
                      {session.notes ? (
                        <NotesDisplay content={session.notes} />
                      ) : (
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[24px] p-12 text-center">
                          <p className="text-zinc-500 font-medium">No notes available. Adjust settings to generate.</p>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              )}

              {activeMode !== "notes" && (
                <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                {activeMode === "podcast" && (
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
                      <audio controls className="w-full h-12 bg-zinc-50 rounded-full" src={(typeof session.podcast === 'object' && 'audioUrl' in session.podcast ? session.podcast.audioUrl : '') || (typeof session.podcast === 'string' ? session.podcast : '')} />
                      {session.podcast && (typeof session.podcast === 'object' && 'script' in session.podcast ? session.podcast.script : session.podcast) && (
                        <div className="mt-8 pt-8 border-t border-zinc-100">
                            <h4 className="font-semibold text-zinc-700 mb-4">Live Transcript</h4>
                            <div className="prose prose-sm text-zinc-600">
                              {typeof session.podcast === 'object' && 'script' in session.podcast ? session.podcast.script : session.podcast}
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
                        {(session.flashcards as any)?.flashcards?.map((card: { front: string; back: string }, idx: number) => (
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
                        {(session.quiz as any)?.quiz?.map((q: { question: string; options: string[]; answer_index:number; explanation:string }, i: number) => (
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
                        <p className="text-lg text-zinc-700 text-center leading-relaxed mb-10">{(session.quest as any).story}</p>
                        <div className="flex flex-col gap-3 w-full">
                          {(session.quest as any).options?.map((opt: string, i: number) => (
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
                    <div className="w-full h-full min-h-[400px] mt-6 relative z-10">
                      <MindMap data={session.visual as any} />
                    </div>
                  ) : (
                    <Button onClick={() => generateContent("visual")} className="mt-4 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium relative z-10 w-max">
                      Generate Dependencies
                    </Button>
                  )}
                </div>
              )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
