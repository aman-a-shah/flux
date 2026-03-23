"use client";

import { useAppStore } from "@/lib/store";
import { Plus, Sparkles, Brain, Zap, Volume2, Gamepad2, Network, Layers, CheckSquare } from "lucide-react";
import Link from "next/link";
import { SessionCard } from "@/components/session/SessionCard";

export default function DashboardPage() {
  const { sessions } = useAppStore();

  return (
    <div className="h-screen w-full bg-white overflow-hidden relative z-0">
      {/* Circle Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dashboard-dot-bg" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1.2" fill="#d4d4d8" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dashboard-dot-bg)" />
        </svg>
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.06),rgba(255,255,255,0))] pointer-events-none" />

      {/* Floating Status Elements */}
      <div className="absolute top-8 right-8 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-600 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>{sessions.length} Sessions Ready</span>
        </div>
      </div>

      {/* Floating Cursors with Study Mode Labels */}
      <div className="absolute bottom-1/2 right-235 animate-[bounce_5s_infinite_0.5s] flex items-start gap-1 z-20 pointer-events-none">
        <svg className="w-4 h-4 text-pink-500 fill-pink-500 drop-shadow-md -rotate-12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <polygon points="2,2 22,10 12,14 10,22" />
        </svg>
        <span className="px-2.5 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full shadow-lg">New Study</span>
      </div>

      {/*}
      <div className="absolute top-2/3 left-20 animate-[bounce_6s_infinite_1s] flex items-start gap-1 z-20 pointer-events-none hidden md:flex">
        <svg className="w-4 h-4 text-violet-500 fill-violet-500 drop-shadow-md -rotate-12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <polygon points="2,2 22,10 12,14 10,22" />
        </svg>
        <span className="px-2.5 py-0.5 bg-violet-500 text-white text-[10px] font-bold rounded-full shadow-lg">Quiz</span>
      </div>

      <div className="absolute bottom-1/6 right-12 animate-[bounce_7s_infinite_1.5s] flex items-start gap-1 z-20 pointer-events-none hidden lg:flex">
        <svg className="w-4 h-4 text-orange-500 fill-orange-500 drop-shadow-md -rotate-12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <polygon points="2,2 22,10 12,14 10,22" />
        </svg>
        <span className="px-2.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">Podcast</span>
      </div>
      */}

      {/* Main Content */}
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Welcome back, Scholar</h1>
          <p className="text-zinc-500 font-mono text-sm">You have {sessions.length} active study sessions. Keep the momentum going.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* New Session Card */}
          <Link href="/" className="group relative w-full h-[320px] rounded-[24px] bg-white border border-dashed border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50 transition-all flex flex-col items-center justify-center gap-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-zinc-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors border border-zinc-100 group-hover:border-indigo-100">
              <Plus className="w-6 h-6 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-zinc-600 group-hover:text-indigo-600 transition-colors">New Session</h3>
              <p className="text-sm font-mono text-zinc-400 mt-1">Upload files to begin</p>
            </div>
          </Link>

          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </div>
    </div>
  );
}
