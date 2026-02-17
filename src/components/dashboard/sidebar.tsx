"use client";

import * as React from "react";
import {
    Plus,
    Monitor,
    Trash2,
    PanelLeftClose,
    PanelLeftOpen,
    Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessionStore } from "@/store/session-store";
import { ConnectionModal } from "./connection-modal";
import type { SavedHost } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const {
        sessions,
        activeSessionId,
        savedHosts,
        sidebarOpen,
        setActiveSession,
        setSidebarOpen,
        removeSavedHost,
        loadSavedHosts,
    } = useSessionStore();

    const [modalOpen, setModalOpen] = React.useState(false);
    const [prefill, setPrefill] = React.useState<SavedHost | null>(null);

    React.useEffect(() => {
        loadSavedHosts();
    }, [loadSavedHosts]);

    function handleNewConnection() {
        setPrefill(null);
        setModalOpen(true);
    }

    function handleConnectSaved(host: SavedHost) {
        setPrefill(host);
        setModalOpen(true);
    }

    if (!sidebarOpen) {
        return (
            <div className="flex flex-col items-center py-3 px-1 border-r border-zinc-800 bg-zinc-950">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="mb-4"
                >
                    <PanelLeftOpen className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNewConnection}>
                    <Plus className="h-4 w-4" />
                </Button>
                <ConnectionModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    prefill={prefill}
                />
            </div>
        );
    }

    return (
        <>
            <aside className="w-64 flex flex-col border-r border-zinc-800 bg-zinc-950 shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-100 tracking-tight">
                            SSH Client
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <PanelLeftClose className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* New connection button */}
                <div className="px-3 py-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={handleNewConnection}
                    >
                        <Plus className="h-4 w-4" />
                        New Connection
                    </Button>
                </div>

                {/* Active sessions */}
                {sessions.length > 0 && (
                    <div className="px-3 pb-2">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
                            Active Sessions
                        </p>
                        <div className="space-y-1">
                            {sessions.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSession(s.id)}
                                    className={cn(
                                        "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                                        activeSessionId === s.id
                                            ? "bg-zinc-800 text-white"
                                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "h-1.5 w-1.5 rounded-full shrink-0",
                                            s.status === "connected" && "bg-green-500",
                                            s.status === "connecting" && "bg-yellow-500 animate-pulse",
                                            s.status === "disconnected" && "bg-zinc-600",
                                            s.status === "error" && "bg-red-500",
                                        )}
                                    />
                                    <span className="truncate">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t border-zinc-800 mx-3" />

                {/* Saved hosts */}
                <div className="flex-1 overflow-hidden">
                    <div className="px-3 pt-3">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
                            Saved Hosts
                        </p>
                    </div>
                    <ScrollArea className="flex-1 px-3 pb-3">
                        {savedHosts.length === 0 ? (
                            <p className="text-xs text-zinc-600 px-1 py-2">
                                No saved hosts yet.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {savedHosts.map((h) => (
                                    <div
                                        key={h.id}
                                        className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                                    >
                                        <Server className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                        <button
                                            className="flex-1 text-left truncate"
                                            onClick={() => handleConnectSaved(h)}
                                        >
                                            {h.label}
                                        </button>
                                        <button
                                            onClick={() => removeSavedHost(h.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </aside>

            <ConnectionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                prefill={prefill}
            />
        </>
    );
}

