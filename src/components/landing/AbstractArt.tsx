import React from 'react';
import { cn } from "@/lib/utils";
import { Cpu, Network, Activity, Workflow, Code2, Fingerprint, Database, Sparkles, Globe, LocateFixed, Link as LinkIcon, Command, Box, CpuIcon } from "lucide-react";

const Crosshair = ({ color = "bg-zinc-300" }: { color?: string }) => (
  <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
    <div className={cn("w-full h-[1px] absolute", color)} />
    <div className={cn("h-full w-[1px] absolute", color)} />
  </div>
);

const Dots = ({ color = "text-zinc-400" }: { color?: string }) => (
  <svg className={cn("absolute inset-0 w-full h-full opacity-20 pointer-events-none", color)} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dot-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="currentColor" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="100%" height="100%" fill="url(#dot-grid)" />
  </svg>
);

const BlueprintBox = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <div className={cn("relative bg-white/40 backdrop-blur-sm border border-zinc-200/70 rounded-2xl overflow-hidden group hover:border-indigo-300 transition-colors duration-500", className)}>
    {children}
  </div>
);

export function LeftAbstractArt({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-full p-6 select-none relative", className)}>
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-10 gap-3 w-full h-full opacity-90">
        
        {/* Row 1 */}
        <BlueprintBox className="col-span-2 row-span-2 flex items-center justify-center bg-indigo-50/30 border-indigo-200">
          <Dots color="text-indigo-400" />
          <Network className="w-8 h-8 text-indigo-500" strokeWidth={1.5} />
          <span className="absolute bottom-2 left-2 text-[8px] font-mono text-indigo-400 font-bold tracking-widest">NET_V1</span>
        </BlueprintBox>
        <BlueprintBox className="col-span-1 row-span-1 flex items-center justify-center bg-cyan-50/50 border-cyan-100">
          <Crosshair color="bg-cyan-300" />
        </BlueprintBox>
        
        {/* Row 2 */}
        <BlueprintBox className="col-start-3 col-span-1 row-span-1 flex items-center justify-center bg-emerald-50/50 border-emerald-100">
          <Database className="w-4 h-4 text-emerald-500" strokeWidth={2} />
        </BlueprintBox>
        <BlueprintBox className="col-start-4 col-span-1 row-span-2 flex items-center justify-center bg-fuchsia-50/30 border-fuchsia-200 hover:border-fuchsia-400">
          <Activity className="w-5 h-5 text-fuchsia-400 transform -rotate-90" strokeWidth={1.5} />
        </BlueprintBox>
        
        {/* Row 3 */}
        <BlueprintBox className="col-span-1 row-span-3 flex flex-col items-center justify-center p-2 gap-2 bg-gradient-to-b from-violet-50 to-white border-violet-200">
           <div className="w-full h-1 bg-violet-200 rounded-full" />
           <div className="w-3/4 h-1 bg-violet-200 rounded-full" />
           <div className="w-full h-1 bg-violet-300 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
           <div className="w-1/2 h-1 bg-pink-300 rounded-full" />
        </BlueprintBox>
        <BlueprintBox className="col-span-2 row-span-1 flex items-center px-4 justify-between bg-zinc-900 border-zinc-800">
           <span className="text-[10px] font-mono text-zinc-400 font-bold tracking-wider">SYS.OK</span>
           <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
           </div>
        </BlueprintBox>

        {/* Row 4 */}
        <BlueprintBox className="col-start-2 col-span-2 row-span-2 flex items-center justify-center overflow-hidden bg-rose-50/30 border-rose-200">
           <Dots color="text-rose-300" />
           <svg className="w-full h-full opacity-60 absolute drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M 0,50 Q 25,10 50,50 T 100,50" stroke="currentColor" strokeWidth="2" fill="none" className="text-rose-400" />
           </svg>
           <span className="absolute top-2 right-2 text-[8px] font-mono text-rose-500 font-bold">WAVE.FN</span>
        </BlueprintBox>
        
        {/* Row 5 */}
        <BlueprintBox className="col-start-5 col-span-1 row-span-1 flex items-center justify-center opacity-80 bg-sky-50/50 border-sky-100">
           <Crosshair color="bg-sky-300" />
        </BlueprintBox>

        {/* Row 6 */}
        <BlueprintBox className="col-span-1 row-span-1 flex items-center justify-center bg-blue-50/50 border-blue-200">
          <LocateFixed className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
        </BlueprintBox>
        <BlueprintBox className="col-span-2 row-span-1 flex items-center px-3 gap-2 bg-gradient-to-r from-teal-50 to-white border-teal-200">
           <Code2 className="w-4 h-4 text-teal-500" strokeWidth={1.5} />
           <div className="h-0.5 w-full bg-teal-300 rounded-full" />
        </BlueprintBox>
        <BlueprintBox className="col-start-4 col-span-1 row-span-1 flex items-center justify-center bg-amber-50/50 border-amber-200">
           <div className="w-2 h-2 border border-amber-500 rounded-sm transform rotate-45 shadow-[0_0_5px_rgba(245,158,11,0.5)] bg-amber-200" />
        </BlueprintBox>

        {/* Row 7 */}
        <BlueprintBox className="col-span-3 row-span-2 flex items-center justify-center relative bg-indigo-900 border-indigo-800 hover:border-indigo-500">
          <Workflow className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" strokeWidth={1.5} />
          <Crosshair color="bg-indigo-700" />
          <div className="absolute top-2 left-2 flex gap-1">
             <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
             <div className="w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_5px_rgba(192,132,252,0.8)]" />
          </div>
        </BlueprintBox>
        
        {/* Row 8 */}
        <BlueprintBox className="col-start-5 col-span-1 row-span-1 flex items-center justify-center bg-emerald-50/80 border-emerald-200 shadow-sm">
           <span className="text-[10px] font-mono text-emerald-600 font-black">42</span>
        </BlueprintBox>

        {/* Row 9 */}
        <BlueprintBox className="col-span-1 row-span-2 flex items-center justify-center bg-slate-50 border-slate-200">
           <div className="h-full w-[1px] bg-slate-300 absolute left-1/2" />
           <div className="w-3 h-3 bg-white border-2 border-slate-500 rounded-full z-10" />
        </BlueprintBox>
        <BlueprintBox className="col-span-1 row-span-1 flex items-center justify-center bg-pink-50/50 border-pink-200">
           <Box className="w-4 h-4 text-pink-500" strokeWidth={1.5} />
        </BlueprintBox>
        <BlueprintBox className="col-start-3 col-span-2 row-span-1 flex items-center justify-center bg-cyan-50/50 border-cyan-200">
           <Dots color="text-cyan-300" />
           <span className="text-[10px] font-mono text-cyan-700 font-bold z-10 bg-white/90 px-1 rounded shadow-sm border border-cyan-100">X_Y_Z</span>
        </BlueprintBox>

        {/* Row 10 */}
        <BlueprintBox className="col-start-2 col-span-1 row-span-1 flex items-center justify-center bg-purple-50/80 border-purple-200">
           <Crosshair color="bg-purple-300" />
        </BlueprintBox>

      </div>
    </div>
  );
}

export function RightAbstractArt({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-full p-6 select-none relative", className)}>
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-10 gap-3 w-full h-full opacity-90 pl-8">
        
        {/* Row 1 */}
        <BlueprintBox className="col-start-3 col-span-1 row-span-1 flex items-center justify-center bg-rose-50/50 border-rose-200">
           <Crosshair color="bg-rose-300" />
        </BlueprintBox>
        <BlueprintBox className="col-start-4 col-span-1 row-span-2 flex items-center justify-center bg-indigo-50/40 border-indigo-200">
           <LinkIcon className="w-5 h-5 text-indigo-500 transform rotate-45" strokeWidth={1.5} />
        </BlueprintBox>
        <BlueprintBox className="col-start-5 col-span-2 row-span-2 flex items-center justify-center overflow-hidden bg-cyan-900 border-cyan-800 hover:border-cyan-500">
          <Dots color="text-cyan-800" />
          <Fingerprint className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)] group-hover:text-cyan-300 transition-colors" strokeWidth={1.5} />
        </BlueprintBox>

        {/* Row 3 */}
        <BlueprintBox className="col-start-2 col-span-1 row-span-1 flex items-center justify-center opacity-80 bg-amber-50/50 border-amber-200">
           <Crosshair color="bg-amber-300" />
        </BlueprintBox>
        <BlueprintBox className="col-start-4 col-span-2 row-span-1 flex items-center px-4 justify-between bg-gradient-to-l from-emerald-50 to-white border-emerald-200">
           <div className="flex gap-1">
             <div className="w-1 h-3 bg-emerald-200 rounded-sm" />
             <div className="w-1 h-3 bg-emerald-300 rounded-sm" />
             <div className="w-1 h-3 bg-emerald-500 rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
           </div>
           <span className="text-[10px] font-mono text-emerald-600 font-bold">LND.01</span>
        </BlueprintBox>
        <BlueprintBox className="col-start-6 col-span-1 row-span-3 flex flex-col items-center justify-center p-2 gap-2 bg-purple-50/50 border-purple-200">
           <div className="w-1 h-8 bg-purple-200 rounded-full" />
           <div className="w-1 h-12 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
           <div className="w-1 h-4 bg-pink-300 rounded-full" />
        </BlueprintBox>

        {/* Row 4 */}
        <BlueprintBox className="col-start-4 col-span-2 row-span-2 flex items-center justify-center relative bg-orange-50/30 border-orange-200">
           <Crosshair color="bg-orange-200" />
           <Globe className="w-8 h-8 text-orange-400" strokeWidth={1.5} />
        </BlueprintBox>
        
        {/* Row 5 */}
        <BlueprintBox className="col-start-2 col-span-1 row-span-1 flex items-center justify-center bg-indigo-50/50 border-indigo-200">
           <Command className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
        </BlueprintBox>

        {/* Row 6 */}
        <BlueprintBox className="col-start-3 col-span-1 row-span-1 flex items-center justify-center border-dashed border-teal-300 bg-teal-50/30">
           <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_5px_rgba(45,212,191,0.5)]" />
        </BlueprintBox>
        <BlueprintBox className="col-start-4 col-span-2 row-span-1 flex items-center px-3 gap-2 bg-fuchsia-50/40 border-fuchsia-200">
           <div className="h-0.5 w-full bg-fuchsia-200 rounded-full" />
           <CpuIcon className="w-4 h-4 text-fuchsia-500" strokeWidth={1.5} />
        </BlueprintBox>
        <BlueprintBox className="col-start-6 col-span-1 row-span-1 flex items-center justify-center bg-slate-50/80 border-slate-200">
           <Crosshair color="bg-slate-300" />
        </BlueprintBox>

        {/* Row 7 */}
        <BlueprintBox className="col-start-4 col-span-3 row-span-2 flex items-center justify-center relative bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <Cpu className="w-10 h-10 text-indigo-500 drop-shadow-md" strokeWidth={1.5} />
          <Dots color="text-indigo-300" />
          <div className="absolute bottom-2 right-2 text-[8px] font-mono text-purple-600 font-bold bg-white/80 px-1 rounded">CORE</div>
        </BlueprintBox>
        
        {/* Row 8 */}
        <BlueprintBox className="col-start-2 col-span-1 row-span-1 flex items-center justify-center bg-gray-900 border-gray-800 shadow-sm transition-colors hover:border-gray-600">
           <span className="text-[10px] font-mono text-gray-300 font-bold tracking-widest">99</span>
        </BlueprintBox>

        {/* Row 9 */}
        <BlueprintBox className="col-start-3 col-span-2 row-span-1 flex items-center justify-center bg-blue-50/40 border-blue-200">
           <Dots color="text-blue-300" />
           <span className="text-[10px] font-mono text-blue-600 font-bold z-10 bg-white/90 px-1 rounded shadow-sm border border-blue-100">A_B_C</span>
        </BlueprintBox>
        <BlueprintBox className="col-start-5 col-span-1 row-span-1 flex items-center justify-center bg-red-50/50 border-red-200">
           <Box className="w-4 h-4 text-red-400" strokeWidth={1.5} />
        </BlueprintBox>
        <BlueprintBox className="col-start-6 col-span-2 row-span-2 flex items-center justify-center relative overflow-hidden bg-emerald-50/30 border-emerald-200">
           <svg className="w-full h-full opacity-50 absolute drop-shadow-sm" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M 0,100 Q 50,50 100,0" stroke="currentColor" strokeWidth="2" fill="none" className="text-emerald-500" />
           </svg>
           <Crosshair color="bg-emerald-200" />
        </BlueprintBox>

        {/* Row 10 */}
        <BlueprintBox className="col-start-4 col-span-1 row-span-1 flex items-center justify-center bg-zinc-50/80 border-zinc-200">
           <Crosshair color="bg-zinc-300" />
        </BlueprintBox>

      </div>
    </div>
  );
}
