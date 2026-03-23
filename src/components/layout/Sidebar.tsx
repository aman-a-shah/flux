"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  MessageSquare,
  Settings,
  Plus,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, sessions, activeSessionId } = useAppStore();

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard", show: true },
    { 
      icon: FolderOpen, 
      label: "Session Files", 
      href: `/dashboard/session/${activeSessionId}?view=files`, 
      show: !!activeSessionId 
    },
    { 
      icon: MessageSquare, 
      label: "Tweak Session", 
      href: `/dashboard/session/${activeSessionId}?view=chat`, 
      show: !!activeSessionId 
    },
  ];

  return (
    <div className="flex h-screen border-r border-zinc-200 bg-zinc-50 shrink-0">
      {/* Slim Icon Rail */}
      <div className="w-[60px] flex flex-col items-center py-4 border-r border-zinc-200 bg-white z-20 shadow-sm">
        <Link href="/" className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center mb-8 border border-zinc-800 shadow-lg hover:scale-105 transition-transform">
          <BookOpen className="text-indigo-400 w-5 h-5" />
        </Link>

        <nav className="flex-1 flex flex-col gap-4 w-full px-2">
          {navItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger>
                  <Link
                    href={item.href}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mx-auto transition-colors cursor-pointer",
                      isActive
                        ? "bg-white border border-zinc-200 text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 hover:border hover:border-zinc-200"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-white text-zinc-900 border-zinc-200 shadow-sm">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 px-2">
          <Tooltip>
            <TooltipTrigger>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 mx-auto cursor-pointer"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-white text-zinc-900 border-zinc-200 shadow-sm">
              Toggle Sidebar
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <div
                onClick={() => window.location.href = "/dashboard/settings"}
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <Settings className="w-5 h-5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-white text-zinc-900 border-zinc-200 shadow-sm">
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Secondary Nav Panel (Expandable) */}
      <div
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-300 ease-in-out bg-zinc-50/50 shadow-inner relative",
          sidebarOpen ? "w-[240px]" : "w-0"
        )}
      >
        <div className="p-4 w-[240px] shrink-0 h-16 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500 tracking-wider">Sessions</h2>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 w-[240px] shrink-0">
          <div className="p-3 space-y-1">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/session/${session.id}`}
                className={cn(
                  "flex flex-col gap-1 p-3 rounded-xl transition-all",
                  activeSessionId === session.id
                    ? "bg-white border border-zinc-200 shadow-sm text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                )}
              >
                <div className="text-sm font-medium line-clamp-1">{session.title}</div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span>{session.date}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span>{session.progress}% mastery</span>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
