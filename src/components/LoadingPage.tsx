"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Brain, FileText, Layers, CheckSquare, Volume2, Gamepad2, Network, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingPageProps {
  sessionId: string;
  selectedModes: string[];
  topic: string;
}

const MODE_CONFIGS = {
  notes: { icon: FileText, label: "Notes", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  flashcards: { icon: Layers, label: "Flashcards", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  quiz: { icon: CheckSquare, label: "Quiz", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  quest: { icon: Gamepad2, label: "Quest", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  visual: { icon: Network, label: "Visual", color: "text-pink-600", bgColor: "bg-pink-50", borderColor: "border-pink-200" },
  podcast: { icon: Volume2, label: "Podcast", color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-cyan-200" },
};

export default function LoadingPage({ sessionId, selectedModes, topic }: LoadingPageProps) {
  const router = useRouter();
  const [completedModes, setCompletedModes] = useState<Set<string>>(new Set());
  const [currentMode, setCurrentMode] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;

    const startGeneration = async () => {
      try {
        // Start the generation process
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, modes: selectedModes, topic }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to start generation`);
        }

        // Poll for completion
        checkInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/sessions/${sessionId}`);
            if (statusResponse.ok) {
              const session = await statusResponse.json();

              const newlyCompleted: string[] = [];
              selectedModes.forEach(mode => {
                const dbField = mode === "podcast" ? "podcast" : mode;
                const fieldContent = session[dbField];
                
                // Field is complete if it has actual generated content
                // For notes: check for [GENERATED_NOTES] marker indicating generation happened
                // For others: just check if field has content
                const isComplete = mode === 'notes' 
                  ? fieldContent && fieldContent.includes('[GENERATED_NOTES]')
                  : fieldContent && fieldContent.length > 0;
                
                if (isComplete && !completedModes.has(mode)) {
                  newlyCompleted.push(mode);
                }
              });

              if (newlyCompleted.length > 0) {
                setCompletedModes(prev => new Set([...prev, ...newlyCompleted]));
                setCurrentMode(newlyCompleted[newlyCompleted.length - 1]);
              }

              const completedCount = selectedModes.filter(mode => {
                const dbField = mode === "podcast" ? "podcast" : mode;
                const fieldContent = session[dbField];
                // Count complete if it has generated content
                return mode === 'notes'
                  ? fieldContent && fieldContent.includes('[GENERATED_NOTES]')
                  : fieldContent && fieldContent.length > 0;
              }).length;

              setProgress((completedCount / selectedModes.length) * 100);

              if (completedCount === selectedModes.length) {
                setIsComplete(true);
                clearInterval(checkInterval);
                // Redirect after a short delay to show completion
                setTimeout(() => {
                  router.push(`/dashboard/session/${sessionId}`);
                }, 1500);
              }
            }
          } catch (error) {
            console.error('Error checking status:', error);
          }
        }, 2000);

      } catch (error) {
        console.error('Error starting generation:', error);
      }
    };

    startGeneration();

    // Progress animation
    interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90 && !isComplete) return prev;
        return Math.min(prev + Math.random() * 2, 90);
      });
    }, 300);

    return () => {
      if (interval) clearInterval(interval);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [sessionId, selectedModes, topic, router, completedModes, isComplete]);

  return (
    <div className="h-screen w-full bg-white overflow-hidden relative z-0">
      {/* Circle Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="loading-dot-bg" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1.2" fill="#d4d4d8" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#loading-dot-bg)" />
        </svg>
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.06),rgba(255,255,255,0))] pointer-events-none" />

      {/* Floating Status */}
      <div className="absolute top-8 left-8 z-5 pointer-events-none">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-600 shadow-sm">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Generating Study Materials</span>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="max-w-2xl w-full px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 mb-6">
              <Brain className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">AI Study Engine</span>
            </div>

            <h1 className="text-4xl font-bold text-zinc-900 mb-4">
              Crafting your study session
            </h1>

            <p className="text-lg text-zinc-600 mb-2">
              "{topic}"
            </p>

            <p className="text-sm text-zinc-500">
              Generating {selectedModes.length} study mode{selectedModes.length > 1 ? 's' : ''} with AI
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-700">Progress</span>
              <span className="text-sm text-zinc-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Mode Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {selectedModes.map((mode) => {
              const config = MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS] || MODE_CONFIGS.notes;
              const Icon = config.icon;
              const isCompleted = completedModes.has(mode);
              const isCurrent = currentMode === mode && !isCompleted;

              return (
                <div
                  key={mode}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-300",
                    config.bgColor,
                    config.borderColor,
                    isCompleted && "border-green-300 bg-green-50",
                    isCurrent && "border-indigo-300 bg-indigo-50 shadow-lg scale-105"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isCompleted ? "bg-green-100" : isCurrent ? "bg-indigo-100" : "bg-white/50"
                    )}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      ) : (
                        <Icon className={cn("w-5 h-5", config.color)} />
                      )}
                    </div>

                    <div>
                      <h3 className={cn(
                        "font-medium text-sm",
                        isCompleted ? "text-green-700" : config.color
                      )}>
                        {config.label}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {isCompleted ? "Complete" : isCurrent ? "Generating..." : "Waiting"}
                      </p>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completion Message */}
          {isComplete && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-50 border border-green-200 mb-4">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">All study materials ready!</span>
              </div>
              <p className="text-zinc-600">Redirecting to your study session...</p>
            </div>
          )}

          {/* Current Activity */}
          {!isComplete && currentMode && (
            <div className="text-center">
              <p className="text-sm text-zinc-500">
                Currently generating <span className="font-medium text-zinc-700">{MODE_CONFIGS[currentMode as keyof typeof MODE_CONFIGS]?.label || currentMode}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}