import { create } from "zustand";

type ModeId = "podcast" | "quest" | "visual" | "notes" | "flashcards" | "quiz" | "audio";

export interface Session {
  id: string;
  title: string;
  date: string;
  lastStudied: string;
  materials: {
    pdfs: number;
    audio: number;
    video: number;
    image: number;
  };
  activeModes?: string[];
  files?: Array<{ name: string; type: string }>;
  notes?: string | null;
  flashcards?: any | null;
  quiz?: any | null;
  quest?: any | null;
  podcast?: any | null;
  visual?: any | null;
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
  addSession: (title?: string, files?: any, activeModes?: string[]) => Promise<any>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllSessions: () => Promise<void>;
  
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
  
  addSession: async (title, files, activeModes) => {
    try {
      const formData = new FormData();
      if (title) {
        formData.append('title', title);
      }
      if (activeModes) {
        formData.append('activeModes', JSON.stringify(activeModes));
      }

      // Add actual files to FormData
      if (files && Array.isArray(files)) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText.substring(0, 100)}`);
      }
      
      const newSession = await res.json();
      
      // Add to local state with default values for missing fields to prevent UI crashes
      const completeSession: Session = {
        id: newSession.id,
        title: newSession.title || title || "New Session",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        lastStudied: "Just now",
        materials: {
          pdfs: files?.filter((f: any) => f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf')).length || 0,
          audio: files?.filter((f: any) => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(f.name)).length || 0,
          video: files?.filter((f: any) => f.type.startsWith('video/') || /\.(mp4|webm|avi|mkv|mov|flv|wmv)$/i.test(f.name)).length || 0,
          image: files?.filter((f: any) => f.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(f.name)).length || 0
        },
        files: files?.map((f: any) => ({ name: f.name, type: f.type })),
        activeModes: activeModes || ["notes"],
        ...newSession
      };

      set((state) => ({
        sessions: [completeSession, ...state.sessions],
        activeSessionId: completeSession.id
      }));
      
      return completeSession;
    } catch (e) {
      console.error("Failed to add session:", e);
      throw e;
    }
  },
  
  deleteSession: async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== id),
          activeSessionId: state.activeSessionId === id ? (state.sessions.length > 1 ? state.sessions.find(s => s.id !== id)?.id || null : null) : state.activeSessionId
        }));
      }
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  },
  
  deleteAllSessions: async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE"
      });
      if (res.ok) {
        set({ sessions: [], activeSessionId: null });
      }
    } catch (e) {
      console.error("Failed to delete all sessions", e);
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
