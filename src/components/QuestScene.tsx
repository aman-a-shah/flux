import React from 'react';

interface QuestSceneProps {
  story: string;
  step: number;
  options: string[];
  win?: boolean;
  lose?: boolean;
  visual?: string;
}

export function QuestScene({ story, step, options, win, lose, visual }: QuestSceneProps) {
  // Image generation removed - component returns null
  return null;
}