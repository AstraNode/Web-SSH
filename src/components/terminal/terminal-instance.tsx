"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { useSessionStore } from "@/store/session-store";
import { toast } from "@/hooks/use-toast";

interface TerminalInstanceProps {
    sessionId: string;
    active: boolean;
}

/**
 * GPU-accelerated terminal backed by xterm.js.
 *
 * Performance strategy:
 *  • WebGL addon for GPU rendering
 *  • requestAnimationFrame write-buffer to coalesce high-frequency output
 *  • Debounced resize to avoid flooding the backend with pty resize calls
 */
export function TerminalInstance({ sessionId, active }: TerminalInstanceProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<any>(null);
    const fitRef = useRef<any>(null);
    const bufferRef = useRef<string>("");
    const rafRef = useRef<number | null>(null);
    const disposersRef = useRef<Array<() => void>>([]);

    const updateStatus = useSessionStore((s) => s.updateStatus);
    const removeSession = useSessionStore((s) => s.removeSession);

    /* ── fit the terminal whenever this tab becomes active ── */
    useEffect(() => {
        if (active && fitRef.current) {
            try {
                fitRef.current.fit();
            } catch {
                /* ignore if container not ready */
            }
        }
    }, [active]);

    /* ── main setup effect ── */
    useEffect(() => {
        let disposed = false;

        async function init() {
            if (!containerRef.current) return;

            /* Dynamic imports – keeps bundle lean & avoids SSR crashes */
            const { Terminal } = await import("@xterm/xterm");
            const { FitAddon } = await import("@xterm/addon-fit");
            const { WebglAddon } = await import("@xterm/addon-webgl");

            // Also import xterm CSS
            await import("@xterm/xterm/css/xterm.css");

            if (disposed) return;

            const terminal = new Terminal({
                cursorBlink: true,
                cursorStyle: "block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                fontWeight: "400",
                fontWeightBold: "700",
                lineHeight: 1.25,
                letterSpacing: 0,
                scrollback: 10_000,
                allowProposedApi: true,
                theme: {
                    background: "#000000",
                    foreground: "#FFFFFF",
                    cursor: "#FFFFFF",
                    cursorAccent: "#000000",
                    selectionBackground: "rgba(255,255,255,0.18)",
                    selectionForeground: "#FFFFFF",
                    black: "#000000",
                    white: "#FFFFFF",
                    brightBlack: "#555555",
                    brightWhite: "#FFFFFF",
                },
            });

            const fitAddon = new FitAddon();
            terminal.loadAddon(fitAddon);
            terminal.open(containerRef.current);

            /* GPU-accelerated renderer — graceful fallback to canvas */
            try {
                const webgl = new WebglAddon();
                webgl.onContextLoss(() => {
                    webgl.dispose();
                });
                terminal.loadAddon(webgl);
            } catch {
                console.warn("[terminal] WebGL unavailable – using canvas renderer");
            }

            fitAddon.fit();
            terminal.focus();

            termRef.current = terminal;
            fitRef.current = fitAddon;

            /* ── Socket integration ── */
            const socket = getSocket();

            /* Buffered write to coalesce rapid output (e.g. `top`, `cat bigfile`) */
            function flushBuffer() {
                if (termRef.current && bufferRef.current.length > 0) {
                    termRef.current.write(bufferRef.current);
                    bufferRef.current = "";
                }
                rafRef.current = null;
            }

            function onData(payload: { sessionId: string; data: string }) {
                if (payload.sessionId !== sessionId) return;
                bufferRef.current += payload.data;
                if (rafRef.current === null) {
                    rafRef.current = requestAnimationFrame(flushBuffer);
                }
            }

            function onConnected(payload: { sessionId: string }) {
                if (payload.sessionId !== sessionId) return;
                updateStatus(sessionId, "connected");
            }

            function onError(payload: { sessionId: string; message: string }) {
                if (payload.sessionId !== sessionId) return;
                updateStatus(sessionId, "error");
                terminal.write(`\r\n\x1b[1;31m✖ ${payload.message}\x1b[0m\r\n`);
                toast({
                    title: "Connection Error",
                    description: payload.message,
                    variant: "destructive",
                });
            }

            function onClosed(payload: { sessionId: string }) {
                if (payload.sessionId !== sessionId) return;
                updateStatus(sessionId, "disconnected");
                terminal.write("\r\n\x1b[1;33m⚠ Connection closed.\x1b[0m\r\n");
                toast({
                    title: "Session Closed",
                    description: `Connection to the host has been closed.`,
                });
            }

            socket.on("session:data", onData);
            socket.on("session:connected", onConnected);
            socket.on("session:error", onError);
            socket.on("session:closed", onClosed);

            /* Forward keystrokes to the backend */
            const inputDisposable = terminal.onData((data: string) => {
                socket.emit("session:input", { sessionId, data });
            });

            /* Debounced resize handler */
            let resizeTimer: ReturnType<typeof setTimeout>;
            const observer = new ResizeObserver(() => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (!fitRef.current || !termRef.current) return;
                    try {
                        fitRef.current.fit();
                        const { cols, rows } = termRef.current;
                        socket.emit("session:resize", { sessionId, cols, rows });
                    } catch {
                        /* container may have been removed */
                    }
                }, 150);
            });

            if (containerRef.current) observer.observe(containerRef.current);

            /* Register disposers */
            disposersRef.current = [
                () => socket.off("session:data", onData),
                () => socket.off("session:connected", onConnected),
                () => socket.off("session:error", onError),
                () => socket.off("session:closed", onClosed),
                () => inputDisposable.dispose(),
                () => observer.disconnect(),
                () => clearTimeout(resizeTimer),
                () => {
                    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
                },
                () => terminal.dispose(),
            ];
        }

        init();

        return () => {
            disposed = true;
            disposersRef.current.forEach((fn) => fn());
            disposersRef.current = [];
        };
    }, [sessionId, updateStatus]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-black"
            style={{
                display: active ? "block" : "none",
                padding: 4,
            }}
        />
    );
}