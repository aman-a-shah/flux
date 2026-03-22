"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { LeftAbstractArt, RightAbstractArt } from "@/components/landing/AbstractArt";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Paperclip, Mic, Image as ImageIcon, FileText, Layers, Gamepad2, Volume2, Network, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STUDY_MODES = [
  { id: "notes", icon: FileText, label: "Notes" },
  { id: "flashcards", icon: Layers, label: "Flashcards" },
  { id: "quiz", icon: Sparkles, label: "Quiz" },
  { id: "audio", icon: Volume2, label: "Podcast" },
  { id: "quest", icon: Gamepad2, label: "Gamify" },
  { id: "visual", icon: Network, label: "Graph" },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [selectedModes, setSelectedModes] = useState<string[]>(["notes"]);
  const { addSession, setActiveMode } = useAppStore();

  const toggleMode = (id: string) => {
    setSelectedModes(prev =>
      prev.includes(id) && prev.length > 1
        ? prev.filter(m => m !== id)
        : prev.includes(id)
          ? prev
          : [...prev, id]
    );
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    await addSession(topic, { pdfs: 0, audio: 0, video: 0, image: 0 });
    setActiveMode(selectedModes[0] as any);
    router.push("/dashboard");
  };

  return (
    <div className="h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans flex flex-col relative selection:bg-indigo-500/20 selection:text-indigo-900 z-0">

      {/* Blueprint Dot Grid Background Pattern */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <svg className="w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-bg" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1.2" fill="#d4d4d8" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-bg)" />
        </svg>
      </div>

      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.06),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative z-20">
        <Navbar />
      </div>

      <main className="flex-1 w-full relative z-10 flex items-center justify-center">

        {/* Abstract Blueprint Grid Art Left & Right */}
        <div
          className="absolute inset-y-0 left-0 w-1/4 xl:w-[350px] pointer-events-none hidden lg:block z-0 opacity-100"
          style={{ maskImage: 'linear-gradient(to right, black 20%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 20%, transparent 100%)' }}
        >
          <LeftAbstractArt />
        </div>
        <div
          className="absolute inset-y-0 right-0 w-1/4 xl:w-[350px] pointer-events-none hidden lg:block z-0 opacity-100"
          style={{ maskImage: 'linear-gradient(to left, black 20%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 100%)' }}
        >
          <RightAbstractArt />
        </div>

        {/* Center Content Map */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-3xl px-6 min-h-[500px] mt-[13px]">

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-500 mb-4 shadow-sm cursor-default animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
            <span>Flux 1.0 Engine is online.</span>
          </div>

          <div className="relative flex flex-col items-center text-center">
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-zinc-900 animate-in fade-in slide-in-from-bottom-4 duration-700">
              What are we
            </h2>

            <div className="relative -mt-3">
              {/* Floating Cursor 1 (Top Left) */}
              <div className="absolute -top-6 -left-12 md:-left-20 animate-[bounce_4s_infinite] flex items-start gap-1 z-20 pointer-events-none">
                <svg className="w-4 h-4 text-emerald-500 fill-emerald-500 drop-shadow-md -rotate-12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="2,2 22,10 12,14 10,22" />
                </svg>
                <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-lg">interactive</span>
              </div>

              {/* Floating Cursor 2 (Bottom Right) */}
              <div className="absolute -bottom-2 -right-12 md:-right-20 animate-[bounce_5s_infinite_0.5s] flex items-start gap-1 z-20 pointer-events-none">
                <svg className="w-4 h-4 text-pink-500 fill-pink-500 drop-shadow-md -rotate-12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="2,2 22,10 12,14 10,22" />
                </svg>
                <span className="px-2.5 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full shadow-lg">gamify</span>
              </div>

              {/* Floating Cursor 3 (Bottom Left - Spread Evenly) */}
              <div className="absolute -bottom-6 left-8 md:left-16 animate-[bounce_6s_infinite_1s] flex items-start gap-1 z-20 pointer-events-none hidden sm:flex">
                <svg className="w-4 h-4 text-violet-500 fill-violet-500 drop-shadow-md -rotate-12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="2,2 22,10 12,14 10,22" />
                </svg>
                <span className="px-2.5 py-0.5 bg-violet-500 text-white text-[10px] font-bold rounded-full shadow-lg">fun</span>
              </div>

              <h1 className="text-6xl sm:text-15xl md:text-[135px] font-black tracking-tighter uppercase relative z-10 animate-in zoom-in-95 duration-700 delay-150 text-white leading-none">
                <span className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
                  WebkitTextStroke: "2px #6366f1",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 0 20px rgba(99,102,241,0.6)",
                  zIndex: -1
                }}>
                  Learning
                </span>
                Learning
              </h1>
            </div>

            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-zinc-900 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 -mt-3">
              today?
            </h2>
          </div>

          <p className="text-zinc-500 text-center mt-4 mb-[68px] max-w-sm text-xs md:text-sm animate-in fade-in duration-700 delay-300">
            Upload your materials and Flux will perfectly shape them to your preferred style.
          </p>

          <div className="w-full max-w-xl flex flex-col gap-2 relative z-30 pointer-events-auto">
            <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center justify-start sm:justify-center gap-1 mb-1 pb-1 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              {STUDY_MODES.map((mode) => {
                const isSelected = selectedModes.includes(mode.id);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => toggleMode(mode.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 shadow-sm border",
                      isSelected
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white/80 backdrop-blur-md text-zinc-600 border-zinc-200 hover:bg-white hover:border-zinc-300"
                    )}
                  >
                    <mode.icon className={cn("w-3.5 h-3.5", isSelected ? "text-indigo-400" : "text-zinc-400")} />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleStartSession} className="w-full flex flex-col gap-3 relative z-30 group animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">

              <div className="relative w-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[20px] blur opacity-[0.10] group-focus-within:opacity-25 transition duration-500 pointer-events-none" />
                <div className="relative bg-white/95 backdrop-blur-xl border border-zinc-200 shadow-md rounded-2xl px-4 py-3 flex items-center transition-all focus-within:border-zinc-300 focus-within:shadow-xl w-full">
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What do you want to master today?"
                    className="w-full bg-transparent text-xs md:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between w-full px-2 z-20">
                <div className="flex items-center gap-1">
                  <button type="button" className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100/80 rounded-xl transition-colors shrink-0" title="Attach Document">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100/80 rounded-xl transition-colors shrink-0" title="Image Upload">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100/80 rounded-xl transition-colors shrink-0" title="Voice Recording">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={!topic.trim()}
                  className="rounded-lg px-4 h-8 bg-zinc-900 hover:bg-zinc-800 text-white shadow-md font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-xs"
                >
                  Process <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
