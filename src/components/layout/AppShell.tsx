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
      <div className="flex flex-col flex-1 min-w-0 bg-transparent relative">
        <Header />
        <main className="flex-1 overflow-auto relative bg-[#FAFAFA] z-0">
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
            <svg className="w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dot-bg-dash" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1.2" fill="#d4d4d8" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-bg-dash)" />
            </svg>
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
