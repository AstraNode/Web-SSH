import { create } from "zustand";
import type { SSHSession, SavedHost } from "@/lib/types";

interface SessionStore {
    /* ── state ── */
    sessions: SSHSession[];
    activeSessionId: string | null;
    savedHosts: SavedHost[];
    sidebarOpen: boolean;

    /* ── actions ── */
    addSession: (s: SSHSession) => void;
    removeSession: (id: string) => void;
    setActiveSession: (id: string | null) => void;
    updateStatus: (id: string, status: SSHSession["status"]) => void;
    addSavedHost: (h: SavedHost) => void;
    removeSavedHost: (id: string) => void;
    loadSavedHosts: () => void;
    setSidebarOpen: (open: boolean) => void;
}

const STORAGE_KEY = "ssh_saved_hosts";

export const useSessionStore = create<SessionStore>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    savedHosts: [],
    sidebarOpen: true,

    addSession: (s) =>
        set((st) => ({
            sessions: [...st.sessions, s],
            activeSessionId: s.id,
        })),

    removeSession: (id) =>
        set((st) => {
            const next = st.sessions.filter((s) => s.id !== id);
            return {
                sessions: next,
                activeSessionId:
                    st.activeSessionId === id
                        ? next[next.length - 1]?.id ?? null
                        : st.activeSessionId,
            };
        }),

    setActiveSession: (id) => set({ activeSessionId: id }),

    updateStatus: (id, status) =>
        set((st) => ({
            sessions: st.sessions.map((s) =>
                s.id === id ? { ...s, status } : s,
            ),
        })),

    addSavedHost: (h) =>
        set((st) => {
            const hosts = [...st.savedHosts, h];
            if (typeof window !== "undefined")
                localStorage.setItem(STORAGE_KEY, JSON.stringify(hosts));
            return { savedHosts: hosts };
        }),

    removeSavedHost: (id) =>
        set((st) => {
            const hosts = st.savedHosts.filter((h) => h.id !== id);
            if (typeof window !== "undefined")
                localStorage.setItem(STORAGE_KEY, JSON.stringify(hosts));
            return { savedHosts: hosts };
        }),

    loadSavedHosts: () => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) set({ savedHosts: JSON.parse(raw) });
        } catch {
            /* ignore corrupt data */
        }
    },

    setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));