"use client";

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronRight, Network, Circle } from "lucide-react";

export interface MindMapNode {
  id: string;
  label: string;
  description: string;
  children: MindMapNode[];
}

export function MindMap({ data }: { data: { root: MindMapNode } }) {
  if (!data || !data.root) return null;

  return (
    <div className="w-full h-full overflow-auto bg-slate-50 rounded-2xl border border-slate-200 p-8">
      <div className="min-w-max">
        <TreeNode node={data.root} isRoot />
      </div>
    </div>
  );
}

function TreeNode({ node, isRoot = false }: { node: MindMapNode; isRoot?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex items-center">
      <div className="flex flex-col justify-center items-start py-2">
        <button
          onClick={() => hasChildren && setCollapsed(!collapsed)}
          className={cn(
            "relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left max-w-[300px]",
            isRoot 
              ? "bg-indigo-600 border-indigo-700 text-white shadow-lg" 
              : "bg-white border-slate-200 hover:border-indigo-300 text-slate-900 shadow-sm hover:shadow-md",
          )}
        >
          <div className={cn(
            "flex items-center justify-center rounded-full shrink-0",
            isRoot ? "w-10 h-10 bg-white/20" : "w-8 h-8 bg-indigo-50"
          )}>
            {isRoot ? <Network className="w-5 h-5" /> : <Circle className="w-3 h-3 text-indigo-500" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn("font-bold truncate", isRoot ? "text-lg" : "text-sm")}>
              {node.label}
            </h4>
            {node.description && (
              <p className={cn(
                "text-xs truncate mt-0.5 opacity-80 font-normal",
                isRoot ? "text-indigo-100" : "text-slate-500"
              )}>
                {node.description}
              </p>
            )}
          </div>

          {hasChildren && (
            <div className={cn(
              "ml-2 shrink-0 transition-transform duration-200",
              collapsed ? "rotate-0" : "rotate-90"
            )}>
              <ChevronRight className={cn("w-4 h-4", isRoot ? "text-white/70" : "text-slate-400")} />
            </div>
          )}
        </button>
      </div>
      
      {hasChildren && !collapsed && (
        <div className="flex items-start">
          <div className="w-8 h-px bg-slate-300 shrink-0 my-auto self-center" />
          <div className="flex flex-col gap-4 border-l border-slate-300 pl-0 py-2">
            {node.children.map((child, idx) => (
              <div key={child.id} className="flex items-center relative pl-8">
                 <div className="w-8 h-px bg-slate-300 absolute left-0 top-1/2 -translate-y-1/2" />
                 <TreeNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}