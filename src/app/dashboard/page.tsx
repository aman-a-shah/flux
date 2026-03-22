"use client";

import { useAppStore } from "@/lib/store";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { SessionCard } from "@/components/session/SessionCard";

export default function DashboardPage() {
  const { sessions } = useAppStore();

  return (
    <div className="p-8 max-w-7xl mx-auto">
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

      <div className="mt-16 bg-white border border-zinc-200 rounded-[24px] p-8 relative overflow-hidden group hover:shadow-md transition-all duration-500 flex items-center shadow-sm">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/50 blur-[60px] rounded-full" />
        <div className="relative z-10 flex gap-6 items-center w-full flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center p-[2px]">
            <div className="w-full h-full bg-white rounded-xl flex items-center justify-center border border-indigo-100/50">
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-1">Weekly Mastery Quest</h2>
            <p className="text-zinc-500 text-sm max-w-md">Complete 3 study sessions in Quest Mode this week to unlock the &quot;Focus Scholar&quot; badge.</p>
          </div>
          <div className="ml-auto mt-4 sm:mt-0">
            <button className="px-6 py-2.5 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-all shadow-sm">
              View Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
