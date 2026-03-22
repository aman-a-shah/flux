"use client";

import { useAppStore } from "@/lib/store";
import { fluxModes } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

export function ModeSelector() {
  const { activeMode, setActiveMode } = useAppStore();

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x">
      {fluxModes.map((mode) => {
        const Icon = Icons[mode.icon as keyof typeof Icons] as React.ElementType;
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id as Parameters<typeof setActiveMode>[0])}
            className={cn(
              "snap-start shrink-0 relative flex items-center gap-3 px-5 py-3 rounded-[20px] transition-all duration-300 border",
              isActive 
                ? `bg-white border-zinc-200 shadow-sm` 
                : `bg-zinc-50/50 border-transparent hover:bg-white hover:border-zinc-200 hover:shadow-sm`
            )}
          >
            {isActive && (
              <div className={cn("absolute inset-0 rounded-[20px] opacity-10 transition-opacity", mode.bg)} />
            )}
            
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
              isActive ? `${mode.bg} ${mode.border}` : "bg-white border-zinc-100",
              isActive ? mode.color : "text-zinc-500"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="text-left">
              <div className={cn(
                "font-medium text-sm transition-colors",
                isActive ? "text-zinc-900" : "text-zinc-600"
              )}>
                {mode.name}
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                {mode.description}
              </div>
            </div>

            {isActive && (
              <div className={cn("absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-t-full transition-all", mode.bg.replace('bg-', 'bg-').replace('50', '500'))} />
            )}
          </button>
        );
      })}
    </div>
  );
}
