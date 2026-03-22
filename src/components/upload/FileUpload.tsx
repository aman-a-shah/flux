"use client";

import { UploadCloud, File, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div className="w-full">
      <div 
        className={cn(
          "relative w-full rounded-2xl border-2 border-dashed p-8 transition-colors flex flex-col items-center justify-center text-center",
          isDragging 
            ? "border-purple-500 bg-purple-500/10" 
            : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
      >
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center mb-4 text-purple-400">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-slate-200 mb-1">Upload Study Materials</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-4">
          Drag and drop your PDFs, lecture recordings, images, or paste YouTube links here to begin.
        </p>
        <button className="px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors">
          Select Files
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {/* Mock Uploaded File */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <File className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">Biology_101_Syllabus.pdf</div>
              <div className="text-xs font-mono text-slate-500">2.4 MB</div>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
