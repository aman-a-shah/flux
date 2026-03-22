"use client";

import { useAppStore } from "@/lib/store";
import { Slider } from "@/components/ui/slider";

export function PreferencesPanel() {
  const { preferences, setPreferences } = useAppStore();

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">Learning Profile</h3>
      
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-3">Preferred Output Format</label>
          <div className="grid grid-cols-2 gap-2">
            {(["visual", "auditory", "reading", "kinesthetic"] as const).map((format) => (
              <button
                key={format}
                onClick={() => setPreferences({ format })}
                className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                  preferences.format === format
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                {format.charAt(0).toUpperCase() + format.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-slate-300">Default Complexity</label>
            <span className="text-xs font-mono text-purple-400">{preferences.complexity}%</span>
          </div>
          <Slider 
            value={[preferences.complexity]} 
            onValueChange={(val) => setPreferences({ complexity: (val as number[])[0] })}
            max={100} 
            step={1} 
          />
        </div>
      </div>
    </div>
  );
}
