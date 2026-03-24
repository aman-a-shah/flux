export const mockSessions = [
  {
    id: "s1",
    title: "Biology 101 – Midterm Prep",
    date: "Mar 22",
    lastStudied: "2h ago",
    progress: 80,
    materials: { pdfs: 3, audio: 2, video: 1, image: 0 },
  },
  {
    id: "s2",
    title: "Cognitive Psychology – Final",
    date: "Mar 20",
    lastStudied: "Yesterday",
    progress: 40,
    materials: { pdfs: 5, audio: 1, video: 0, image: 4 },
  },
  {
    id: "s3",
    title: "Intro to Economics",
    date: "Mar 15",
    lastStudied: "3 days ago",
    progress: 15,
    materials: { pdfs: 1, audio: 0, video: 2, image: 0 },
  },
];

export const fluxModes = [
  { id: "notes", name: "Smart Notes", icon: "FileText", description: "Structured & clear", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  { id: "podcast", name: "Audio Immersion", icon: "Mic", description: "Listen anywhere", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
  { id: "visual", name: "Visual Mind Map", icon: "Network", description: "See concepts", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" },
  { id: "quest", name: "Quest Mode", icon: "Gamepad2", description: "5-min challenges", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  { id: "flashcards", name: "Flashcards", icon: "Layers", description: "Spaced repetition", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { id: "quiz", name: "Quiz Generator", icon: "CheckSquare", description: "Test yourself", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
];
