import { create } from "zustand";

type ModeId = "audio" | "quest" | "visual" | "notes" | "flashcards" | "quiz";

export interface Session {
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
}

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;
  
  isLoadingSessions: boolean;
  fetchSessions: () => Promise<void>;
  addSession: (title?: string, files?: any) => Promise<void>;
  
  activeMode: ModeId;
  setActiveMode: (mode: ModeId) => void;
  
  preferences: {
    complexity: number; // 1-100
    format: "visual" | "auditory" | "reading" | "kinesthetic";
  };
  setPreferences: (prefs: Partial<AppState["preferences"]>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  sessions: [],
  activeSessionId: null,
  setActiveSession: (id) => set({ activeSessionId: id }),
  
  isLoadingSessions: false,
  fetchSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const res = await fetch("/api/sessions");
      
      let sessions = [];
      try {
        sessions = await res.json();
      } catch (jsonError) {
        console.error("Failed to parse sessions JSON, server likely returned an HTML error page. Please restart your dev server.", jsonError);
      }
      
      set({ 
        sessions: Array.isArray(sessions) ? sessions : [], 
        activeSessionId: Array.isArray(sessions) && sessions.length > 0 ? sessions[0].id : null,
        isLoadingSessions: false 
      });
    } catch (e) {
      console.error("Failed to fetch sessions", e);
      set({ isLoadingSessions: false });
    }
  },
  
  addSession: async (title, files) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, files })
      });
      const newSession = await res.json();
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        activeSessionId: newSession.id
      }));
    } catch (e) {
      console.error("Failed to add session", e);
    }
  },

  activeMode: "notes",
  setActiveMode: (mode) => set({ activeMode: mode }),
  
  preferences: {
    complexity: 50,
    format: "reading",
  },
  setPreferences: (prefs) => 
    set((state) => ({ preferences: { ...state.preferences, ...prefs } })),
}));
