/* ────────────────────────────────────────────
   Strict interfaces for the entire application
   ──────────────────────────────────────────── */

/** Credentials sent from client → server when opening a session. */
export interface SSHConnectionConfig {
    host: string;
    port: number;
    username: string;
    authMethod: "password" | "privateKey";
    password?: string;
    privateKey?: string;
    passphrase?: string;
    cols?: number;
    rows?: number;
}

/** Runtime representation of an open tab. */
export interface SSHSession {
    id: string;
    label: string;
    host: string;
    port: number;
    username: string;
    status: "connecting" | "connected" | "disconnected" | "error";
}

/** Persisted host (credentials are never stored). */
export interface SavedHost {
    id: string;
    label: string;
    host: string;
    port: number;
    username: string;
    authMethod: "password" | "privateKey";
}

/* ── Socket event payloads ────────────────── */

export interface ServerToClientEvents {
    "session:connected": (p: { sessionId: string }) => void;
    "session:data": (p: { sessionId: string; data: string }) => void;
    "session:error": (p: { sessionId: string; message: string }) => void;
    "session:closed": (p: { sessionId: string }) => void;
}

export interface ClientToServerEvents {
    "session:create": (p: {
        sessionId: string;
        config: SSHConnectionConfig;
    }) => void;
    "session:input": (p: { sessionId: string; data: string }) => void;
    "session:resize": (p: {
        sessionId: string;
        cols: number;
        rows: number;
    }) => void;
    "session:disconnect": (p: { sessionId: string }) => void;
}