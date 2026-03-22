"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
          <BookOpen className="text-indigo-500 w-4 h-4" />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900">Flux</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/dashboard" className={buttonVariants({ variant: "default", className: "text-black hover:bg-zinc-800 rounded-full px-6 font-medium shadow-sm" })}>
          My Study Guides
        </Link>
      </div>
    </nav>
  );
}
