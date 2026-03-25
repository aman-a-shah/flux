"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore, Session } from "@/lib/store";
import { ModeId } from "@/lib/ai";
import { ModeSelector } from "@/components/modes/ModeSelector";
import { NotesDisplay } from "@/components/NotesDisplay";
import { MindMap } from "@/components/MindMap";
import { QuestScene } from "@/components/QuestScene";
import { cn } from "@/lib/utils";
import { Brain, FileText, Zap, Volume2, Gamepad2, Network, Layers, CheckSquare, Loader2, MessageSquare, Folder, FileStack, Plus, ArrowRight, User } from "lucide-react";
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
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: "Hey there! How can I help you refine this session? I can make the notes more technical, add more real-world examples to the quiz, or simplify specific concepts." }
  ]);
  const [failedModes, setFailedModes] = useState<Record<string, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [questLoading, setQuestLoading] = useState(false);
  const [clickedButtonIndex, setClickedButtonIndex] = useState<number | null>(null);
  const [viewedFlashcards, setViewedFlashcards] = useState<Set<number>>(new Set());

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

  const continueQuest = async (choice: string) => {
    if (!session || !session.quest) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          modes: ['quest'],
          topic: session.title,
          complexity: preferences.complexity,
          continueQuest: {
            choice,
            previousStory: (session.quest as any).story,
            step: (session.quest as any).step || 1
          }
        }),
      });
      if (res.ok) {
        await fetchSession();
      } else {
        console.error('Failed to continue quest');
      }
    } catch (error) {
      console.error('Error continuing quest:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateContent = async (modeOrModes: string | string[], tweak?: string) => {
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
          tweak: tweak,
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

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !session) return;
    
    const files = Array.from(e.target.files);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        body: formData
      });

      if (res.ok) {
        await fetchSession(); // Refresh session data
        // Automatically trigger AI re-processing to integrate new files
        await generateContent(['notes']);
      } else {
        console.error("Failed to add files");
      }
    } catch (error) {
      console.error("Error adding files:", error);
    }
  };

  const getFileIcon = (type: string, name: string) => {
    const lowerType = type.toLowerCase();
    const lowerName = name.toLowerCase();
    
    if (lowerType === 'application/pdf' || lowerName.endsWith('.pdf')) return <FileStack className="w-5 h-5 text-indigo-500" />;
    if (lowerType.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg)$/i.test(lowerName)) return <Volume2 className="w-5 h-5 text-violet-500" />;
    if (lowerType.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(lowerName)) return <Volume2 className="w-5 h-5 text-cyan-500" />;
    if (lowerType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(lowerName)) return <FileText className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-zinc-500" />;
  };

  const handleApplyTweak = async () => {
    if (!tweakPrompt.trim() || !session) return;
    
    const userMsg = tweakPrompt.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setTweakPrompt("");
    
    // Check if user wants to add "gamify" or "quest" mode
    const lowerPrompt = userMsg.toLowerCase();
    let modesToUpdate = [...(session.activeModes || ["notes"])];
    let needsUpdate = false;
    
    if ((lowerPrompt.includes("gamify") || lowerPrompt.includes("game") || lowerPrompt.includes("quest")) && !modesToUpdate.includes("quest")) {
      modesToUpdate.push("quest");
      needsUpdate = true;
    }
    
    setGenerating(true);
    try {
      // If we added a new mode, update the session in the DB first
      if (needsUpdate) {
        await fetch(`/api/sessions/${session.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ activeModes: modesToUpdate.join(',') }),
        });
      }
      
      // Trigger generation for all active modes with the tweak
      await generateContent(modesToUpdate, userMsg);
      
      setMessages(prev => [...prev, { role: 'assistant', content: "I've updated your study session based on your request. You can see the changes in the refined materials!" }]);
      await fetchSession(); // Refresh to get the new list of modes and content
    } catch (err) {
      console.error("Failed to apply tweak:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error while trying to update your session. Please try again." }]);
    } finally {
      setGenerating(false);
    }
  };

  const renderFilesView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
            <Folder className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 leading-tight">Session Materials</h2>
            <p className="text-sm text-zinc-500 font-mono">Manage and view your source documents</p>
          </div>
        </div>
        
        <div className="relative">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            multiple 
            onChange={handleAddFile}
          />
          <Button 
            onClick={() => document.getElementById('file-upload')?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Files</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {(session as any).files && (session as any).files.length > 0 ? (
          (session as any).files.map((file: { name: string, type: string }, idx: number) => (
            <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-indigo-50 transition-colors">
                  {getFileIcon(file.type, file.name)}
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 text-sm">{file.name}</h4>
                  <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{file.type || 'Document'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <FileStack className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No files uploaded yet</p>
          </div>
        )}
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

      <div className="flex-1 flex flex-col justify-end gap-6 h-full min-h-[400px] overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2",
              msg.role === 'user' 
                ? "bg-indigo-600 text-white border-indigo-500 ml-12 shadow-md" 
                : "bg-zinc-50 text-zinc-700 border-zinc-200 mr-12 shadow-sm"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                msg.role === 'user' ? "bg-indigo-500 border-indigo-400" : "bg-indigo-50 border-indigo-100"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Brain className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className="text-sm leading-relaxed">
                {msg.content}
              </div>
            </div>
          ))}
          {generating && (
            <div className="flex items-start gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 mr-12 shadow-sm animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                <Brain className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex gap-1 items-center h-5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        <div className="relative group shrink-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl blur opacity-[0.05] group-focus-within:opacity-20 transition duration-500" />
          <div className="relative bg-white border border-zinc-200 rounded-2xl p-2 shadow-sm focus-within:border-indigo-300 focus-within:shadow-md transition-all flex items-center">
            <input
              value={tweakPrompt}
              onChange={(e) => setTweakPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyTweak()}
              placeholder="Ask Flux to modify your session..."
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none placeholder:text-zinc-400"
            />
            <Button 
              onClick={handleApplyTweak}
              disabled={generating || !tweakPrompt.trim()}
              size="icon" 
              className="bg-zinc-900 rounded-xl hover:bg-zinc-800 shrink-0 disabled:opacity-50"
            >
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
    <div className="flex justify-center h-[calc(100vh-64px)] overflow-auto relative">
      <div className="w-full max-w-5xl px-8 flex flex-col h-full bg-transparent z-10">
        {!view && (
          <div className="pt-8 pb-4 shrink-0">
            <ModeSelector activeModes={session.activeModes} />
          </div>
        )}

        <div className="flex-1 overflow-auto p-1 flex flex-col">
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
                          <NotesDisplay content={session.notes} sessionId={resolvedParams.id} />
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
                    <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-zinc-200 rounded-[32px] bg-white shadow-sm overflow-auto p-8">
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
                          <audio
                            controls
                            className="w-full h-12 bg-zinc-50 rounded-full"
                            src={(typeof session.podcast === 'object' && 'audioUrl' in session.podcast ? session.podcast.audioUrl : '') || (typeof session.podcast === 'string' ? session.podcast : '')}
                          />
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
                            <div
                              key={idx}
                              className="group relative w-full h-48 [perspective:1000px] cursor-pointer"
                              onClick={() => {
                                setViewedFlashcards(prev => {
                                  const newSet = new Set(prev);
                                  newSet.add(idx);
                                  return newSet;
                                });
                              }}
                            >
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
                          {(session.quiz as any)?.quiz?.map((q: { question: string; options: string[]; answer_index: number; explanation: string }, i: number) => (
                            <div key={i} className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200">
                              <h4 className="font-semibold text-zinc-800 mb-4">{i + 1}. {q.question}</h4>
                              <div className="flex flex-col gap-2">
                                {q.options.map((opt: string, optIdx: number) => (
                                  <button
                                    key={optIdx}
                                    onClick={() => !quizSubmitted && setSelectedAnswers(prev => ({ ...prev, [i]: optIdx }))}
                                    className={cn(
                                      "text-left px-4 py-3 rounded-lg border transition-colors text-sm text-zinc-700",
                                      selectedAnswers[i] === optIdx ? "border-rose-300 bg-rose-50" : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50",
                                      quizSubmitted && optIdx === q.answer_index ? "border-green-300 bg-green-50" : "",
                                      quizSubmitted && selectedAnswers[i] === optIdx && optIdx !== q.answer_index ? "border-red-300 bg-red-50" : ""
                                    )}
                                  >
                                    <span className="font-mono text-xs text-zinc-400 mr-3">{String.fromCharCode(65 + optIdx)}</span>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                              {quizSubmitted && (
                                <p className="mt-4 text-sm text-zinc-600 italic">{q.explanation}</p>
                              )}
                            </div>
                          ))}
                          {Object.keys(selectedAnswers).length === (session.quiz as any).quiz.length && !quizSubmitted && (
                            <Button onClick={() => {
                              const quizData = (session.quiz as any).quiz;
                              let correct = 0;
                              quizData.forEach((q: any, i: number) => {
                                if (selectedAnswers[i] === q.answer_index) correct++;
                              });
                              setQuizScore(correct);
                              setQuizSubmitted(true);
                            }} className="mt-6 bg-rose-600 hover:bg-rose-700 text-white shadow-sm rounded-full px-8 font-medium">
                              Submit Quiz
                            </Button>
                          )}
                          {quizSubmitted && (
                            <div className="mt-6 text-center">
                              <p className="text-xl font-bold text-zinc-900">Score: {quizScore}/{(session.quiz as any).quiz.length}</p>
                              <Button onClick={() => {
                                setSelectedAnswers({});
                                setQuizSubmitted(false);
                                setQuizScore(null);
                                generateContent("quiz");
                              }} className="mt-4 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium">
                                Try Again
                              </Button>
                            </div>
                          )}
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
                      <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                        {session.quest && (session.quest as any).options ? `Quest - Chapter ${(session.quest as any).step || 1}` :
                          (session.quest as any)?.win ? "Victory!" :
                            (session.quest as any)?.lose ? "Game Over" :
                              "Ready to Play?"}
                      </h3>

                      {generating && !session.quest ? (
                        renderGeneratingState("interactive quest")
                      ) : session.quest ? (
                        <div className="w-full max-w-4xl mx-auto flex flex-col items-center mt-6">
                          {/* Quest Scene Image */}
                          <div className="w-full mb-8">
                            <QuestScene
                              story={(session.quest as any).story || ""}
                              step={(session.quest as any).step || 1}
                              options={(session.quest as any).options || []}
                              win={(session.quest as any).win}
                              lose={(session.quest as any).lose}
                              visual={(session.quest as any).visual}
                            />
                          </div>

                          <p className="text-lg text-zinc-700 text-center leading-relaxed mb-10">{(session.quest as any).story}</p>
                          {(session.quest as any).win ? (
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600 mb-4">🎉 You Win!</p>
                              <Button onClick={() => generateContent("quest")} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm rounded-full px-8 font-medium">
                                Play Again
                              </Button>
                            </div>
                          ) : (session.quest as any).lose ? (
                            <div className="text-center">
                              <p className="text-2xl font-bold text-red-600 mb-4">💀 You Lose!</p>
                              <Button onClick={() => generateContent("quest")} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm rounded-full px-8 font-medium">
                                Try Again
                              </Button>
                            </div>
                          ) : questLoading ? (
                            <div className="flex flex-col items-center gap-4">
                              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                              <p className="text-sm text-zinc-500">Continuing your quest...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3 w-full max-w-xl">
                              {(session.quest as any).options?.map((opt: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setClickedButtonIndex(i);
                                    setQuestLoading(true);
                                    continueQuest(opt).finally(() => {
                                      setClickedButtonIndex(null);
                                      setQuestLoading(false);
                                    });
                                  }}
                                  disabled={questLoading}
                                  className={cn(
                                    "w-full px-6 py-4 font-medium rounded-xl text-left border transition-all duration-200 shadow-sm relative overflow-auto",
                                    "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                                    clickedButtonIndex === i
                                      ? "bg-amber-500 text-white border-amber-400 shadow-lg scale-95 animate-pulse"
                                      : "bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800 hover:border-zinc-700",
                                    questLoading && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <span className="relative z-10">{opt}</span>
                                  {clickedButtonIndex === i && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse opacity-20" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button onClick={() => generateContent("quest")} className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm rounded-full px-8 font-medium">
                          Start Gamified Quest
                        </Button>
                      )}
                    </div>
                  )}

                  {activeMode === "visual" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col border border-zinc-200 rounded-[32px] bg-white shadow-sm p-8 min-h-[60vh] relative overflow-auto">
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
