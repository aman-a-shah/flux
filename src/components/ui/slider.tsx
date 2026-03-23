"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  className?: string;
  defaultValue?: number[];
  value?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
}

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props
}: SliderProps) {
  const uncontrolledValue = defaultValue ? defaultValue[0] : min;
  const currentValue = value ? value[0] : uncontrolledValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onValueChange?.([newValue]);
  };

  return (
    <div className={cn("relative flex w-full touch-none items-center select-none group h-5", className)}>
      <div className="relative w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
        <div 
          className="absolute h-full bg-indigo-500 rounded-full transition-all duration-150"
          style={{ width: `${((currentValue - min) / (max - min)) * 100}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className="absolute w-full h-full opacity-0 cursor-pointer z-20"
        {...props}
      />
      <div 
        className="absolute pointer-events-none w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-md transition-all duration-150 z-10"
        style={{ 
          left: `calc(${((currentValue - min) / (max - min)) * 100}% - 8px)`
        }}
      />
    </div>
  )
}

export { Slider }
