import Link from "next/link";
import { Play, Sparkles, FolderDown, ArrowRight, FileText, Mic, Video, Image as ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";

interface SessionCardProps {
  session: {
    id: string;
    title: string;
    date: string;
    lastStudied: string;
    progress: number;
    materials: {
      pdfs: number;
      audio: number;
      video: number;
      image: number;
    };
  };
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <div className="group relative w-full rounded-[24px] border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full p-6 flex flex-col z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1 transition-colors">
              {session.title}
            </h3>
            <p className="text-sm font-mono text-zinc-500">{session.date}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors shadow-sm">
            {session.progress >= 100 ? (
              <Sparkles className="w-5 h-5 text-emerald-500" />
            ) : (
              <Play className="w-4 h-4 text-indigo-500 ml-0.5" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {session.materials.pdfs > 0 && (
             <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200">
               <FileText className="w-3.5 h-3.5 text-indigo-400" /> {session.materials.pdfs} PDFs
             </div>
          )}
          {session.materials.audio > 0 && (
             <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200">
               <Mic className="w-3.5 h-3.5 text-violet-400" /> {session.materials.audio} Audio
             </div>
          )}
          {session.materials.video > 0 && (
             <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200">
               <Video className="w-3.5 h-3.5 text-cyan-400" /> {session.materials.video} Video
             </div>
          )}
          {session.materials.image > 0 && (
             <div className="flex items-center gap-1.5 text-xs text-zinc-600 bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-200">
               <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> {session.materials.image} Images
             </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2">
            <div className="text-[11px] font-mono text-zinc-500">
              Last active: {session.lastStudied}
            </div>
            <div className="text-xs font-semibold text-indigo-600">{session.progress}%</div>
          </div>
          <Progress 
            value={session.progress} 
            className="h-1.5 bg-zinc-100 mb-6" 
            indicatorColor="bg-indigo-500 shadow-sm"
          />

          <div className="flex gap-2">
            <Link href={`/dashboard/session/${session.id}`} className={buttonVariants({ variant: "default", className: "flex-1 bg-zinc-900 text-white hover:bg-zinc-800 font-medium shadow-sm" })}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Button variant="outline" size="icon" className="border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 shrink-0 shadow-sm">
              <FolderDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
