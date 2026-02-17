"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Sidebar } from "./dashboard/sidebar";
import { TerminalInstance } from "./terminal/terminal-instance";
import { useSessionStore } from "@/store/session-store";
import { getSocket } from "@/lib/socket";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "./ui/toaster";
import { X, Terminal as TerminalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell() {
    const {
        sessions,
        activeSessionId,
        setActiveSession,
        removeSession,
        updateStatus,
    } = useSessionStore();

    /* ── Socket lifecycle ── */
    useEffect(() => {
        const socket = getSocket();

        socket.on("connect", () => {
            console.log("[socket] connected:", socket.id);
        });

        socket.on("disconnect", (reason) => {
            console.warn("[socket] disconnected:", reason);
            toast({
                title: "Disconnected",
                description: "Lost connection to server. Attempting to reconnect…",
                variant: "destructive",
            });
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, []);

    /* ── Close a session tab ── */
    const handleClose = useCallback(
        (id: string) => {
            const socket = getSocket();
            socket.emit("session:disconnect", { sessionId: id });
            removeSession(id);
        },
        [removeSession],
    );

    return (
        <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
            {/* Left sidebar */}
            <Sidebar />

            {/* Main terminal area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Tab bar */}
                {sessions.length > 0 && (
                    <div className="flex items-center border-b border-zinc-800 bg-zinc-950 overflow-x-auto">
                        {sessions.map((s) => (
                            <div
                                key={s.id}
                                className={cn(
                                    "group flex items-center gap-2 px-4 py-2 text-sm cursor-pointer border-r border-zinc-800 shrink-0 transition-colors select-none",
                                    activeSessionId === s.id
                                        ? "bg-black text-white"
                                        : "bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
                                )}
                                onClick={() => setActiveSession(s.id)}
                            >
                                <span
                                    className={cn(
                                        "h-1.5 w-1.5 rounded-full shrink-0",
                                        s.status === "connected" && "bg-green-500",
                                        s.status === "connecting" &&
                                        "bg-yellow-500 animate-pulse",
                                        s.status === "disconnected" && "bg-zinc-600",
                                        s.status === "error" && "bg-red-500",
                                    )}
                                />
                                <span className="truncate max-w-[140px]">{s.label}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClose(s.id);
                                    }}
                                    className="ml-1 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-white transition-opacity"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Terminal instances */}
                <div className="flex-1 relative bg-black">
                    {sessions.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 select-none">
                            <TerminalIcon className="h-16 w-16 mb-4 stroke-[0.5]" />
                            <p className="text-lg font-medium text-zinc-500">
                                No active sessions
                            </p>
                            <p className="text-sm text-zinc-700 mt-1">
                                Open a new connection from the sidebar to start.
                            </p>
                        </div>
                    ) : (
                        sessions.map((s) => (
                            <TerminalInstance
                                key={s.id}
                                sessionId={s.id}
                                active={s.id === activeSessionId}
                            />
                        ))
                    )}
                </div>
            </main>

            {/* Global toast container */}
            <Toaster />
        </div>
    );
}