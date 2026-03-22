"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAppStore } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const fetchSessions = useAppStore(state => state.fetchSessions);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="flex h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 bg-transparent">
        <Header />
        <main className="flex-1 overflow-auto relative bg-[#FAFAFA]">
          {children}
        </main>
      </div>
    </div>
  );
}
