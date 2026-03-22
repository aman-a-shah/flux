import { Search, Bell, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";

export function Header() {
  const { sessions, activeSessionId } = useAppStore();
  const session = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  return (
    <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center gap-6 flex-1">
        {session ? (
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                {session.title}
                <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-50 text-amber-600 text-[10px] border border-amber-100 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                </span>
              </h1>
              <div className="text-xs font-mono text-zinc-500 mt-0.5">
                Last studied: {session.lastStudied}
              </div>
            </div>

            <div className="w-32 hidden md:block ml-4">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5 font-mono">
                <span>Progress</span>
                <span className="text-indigo-600 font-semibold">{session.progress}%</span>
              </div>
              <Progress value={session.progress} className="h-1.5 bg-zinc-100" indicatorColor="bg-indigo-500 shadow-sm" />
            </div>
          </div>
        ) : (
          <div className="text-sm font-medium text-zinc-500">No active session</div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:flex items-center group">
          {/*
          <Search className="absolute left-3 w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search knowledge graph..." 
            className="h-9 w-64 bg-zinc-50 border border-zinc-200 shadow-sm rounded-lg pl-9 pr-12 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all font-mono"
          />
          

          <div className="absolute right-3 flex items-center justify-center w-6 h-5 rounded bg-white text-zinc-400 text-[10px] font-mono border border-zinc-200 shadow-sm">
            ⌘K
          </div>
          */}
        </div>

        {/*
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors border border-transparent hover:border-zinc-200 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
        </button>

        <Avatar className="w-8 h-8 rounded-lg border border-zinc-200 shadow-sm cursor-pointer hover:border-zinc-300 transition-colors">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback className="bg-indigo-50 text-indigo-600 rounded-lg">FX</AvatarFallback>
        </Avatar>
        */}
      </div>
    </header>
  );
}
