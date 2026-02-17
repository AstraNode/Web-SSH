import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { Client, type ClientChannel } from "ssh2";

/* ── Shared type (mirrored from src/lib/types.ts) ── */
interface SSHConnectionConfig {
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

/* ── Session record kept on the server ── */
interface ActiveSession {
    client: Client;
    stream: ClientChannel;
}

/* ── Bootstrap ── */
const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new SocketIOServer(httpServer, {
        cors: { origin: "*" },
        maxHttpBufferSize: 1e8,
        pingTimeout: 30000,
        pingInterval: 25000,
    });

    /**
     * Map<socketId, Map<sessionId, ActiveSession>>
     *
     * Each browser tab (socket) can own multiple SSH sessions (tabs inside the
     * app). When a socket disconnects every session it owns is torn down.
     */
    const socketSessions = new Map<string, Map<string, ActiveSession>>();

    io.on("connection", (socket) => {
        console.log(`[ws] client connected  ${socket.id}`);
        socketSessions.set(socket.id, new Map());

        /* ─────────────── session:create ─────────────── */
        socket.on(
            "session:create",
            (payload: { sessionId: string; config: SSHConnectionConfig }) => {
                const { sessionId, config } = payload;
                const sessions = socketSessions.get(socket.id)!;

                if (sessions.has(sessionId)) {
                    socket.emit("session:error", {
                        sessionId,
                        message: "Duplicate session ID.",
                    });
                    return;
                }

                const conn = new Client();

                conn.on("ready", () => {
                    console.log(`[ssh] ready → ${config.username}@${config.host}:${config.port}`);

                    conn.shell(
                        {
                            term: "xterm-256color",
                            cols: config.cols || 80,
                            rows: config.rows || 24,
                        },
                        (err, stream) => {
                            if (err) {
                                socket.emit("session:error", {
                                    sessionId,
                                    message: `Shell error: ${err.message}`,
                                });
                                conn.end();
                                return;
                            }

                            sessions.set(sessionId, { client: conn, stream });
                            socket.emit("session:connected", { sessionId });

                            stream.on("data", (data: Buffer) => {
                                socket.emit("session:data", {
                                    sessionId,
                                    data: data.toString("utf-8"),
                                });
                            });

                            stream.stderr.on("data", (data: Buffer) => {
                                socket.emit("session:data", {
                                    sessionId,
                                    data: data.toString("utf-8"),
                                });
                            });

                            stream.on("close", () => {
                                socket.emit("session:closed", { sessionId });
                                sessions.delete(sessionId);
                                conn.end();
                            });

                            stream.on("error", (err: Error) => {
                                socket.emit("session:error", {
                                    sessionId,
                                    message: err.message,
                                });
                            });
                        },
                    );
                });

                conn.on("error", (err) => {
                    console.error(`[ssh] error → ${err.message}`);

                    let friendlyMsg = err.message;
                    if (err.message.includes("Authentication")) {
                        friendlyMsg = "Authentication failed. Check your credentials.";
                    } else if (err.message.includes("ECONNREFUSED")) {
                        friendlyMsg = `Connection refused by ${config.host}:${config.port}.`;
                    } else if (err.message.includes("Timed out")) {
                        friendlyMsg = `Connection to ${config.host} timed out.`;
                    } else if (err.message.includes("ENOTFOUND")) {
                        friendlyMsg = `Host not found: ${config.host}`;
                    }

                    socket.emit("session:error", { sessionId, message: friendlyMsg });
                    sessions.delete(sessionId);
                });

                conn.on("end", () => {
                    sessions.delete(sessionId);
                });

                conn.on("close", () => {
                    if (sessions.has(sessionId)) {
                        socket.emit("session:closed", { sessionId });
                        sessions.delete(sessionId);
                    }
                });

                /* Build the connection config for ssh2 */
                const connectOpts: Record<string, any> = {
                    host: config.host,
                    port: config.port,
                    username: config.username,
                    readyTimeout: 10_000,
                    keepaliveInterval: 15_000,
                    keepaliveCountMax: 3,
                };

                if (config.authMethod === "privateKey" && config.privateKey) {
                    connectOpts.privateKey = config.privateKey;
                    if (config.passphrase) connectOpts.passphrase = config.passphrase;
                } else if (config.password) {
                    connectOpts.password = config.password;
                }

                try {
                    conn.connect(connectOpts);
                } catch (err: any) {
                    socket.emit("session:error", {
                        sessionId,
                        message: err.message || "Failed to initiate connection.",
                    });
                    sessions.delete(sessionId);
                }
            },
        );

        /* ─────────────── session:input ─────────────── */
        socket.on("session:input", (payload: { sessionId: string; data: string }) => {
            const session = socketSessions.get(socket.id)?.get(payload.sessionId);
            if (session?.stream.writable) {
                session.stream.write(payload.data);
            }
        });

        /* ─────────────── session:resize ─────────────── */
        socket.on(
            "session:resize",
            (payload: { sessionId: string; cols: number; rows: number }) => {
                const session = socketSessions.get(socket.id)?.get(payload.sessionId);
                if (session?.stream) {
                    session.stream.setWindow(payload.rows, payload.cols, 0, 0);
                }
            },
        );

        /* ─────────────── session:disconnect ─────────────── */
        socket.on("session:disconnect", (payload: { sessionId: string }) => {
            const sessions = socketSessions.get(socket.id);
            const session = sessions?.get(payload.sessionId);
            if (session) {
                try {
                    session.stream.close();
                    session.client.end();
                } catch { /* already closed */ }
                sessions!.delete(payload.sessionId);
            }
        });

        /* ─────────────── disconnect (browser close / refresh) ─────────────── */
        socket.on("disconnect", () => {
            console.log(`[ws] client disconnected ${socket.id}`);
            const sessions = socketSessions.get(socket.id);
            if (sessions) {
                sessions.forEach((s) => {
                    try {
                        s.stream.close();
                        s.client.end();
                    } catch { /* swallow */ }
                });
                sessions.clear();
            }
            socketSessions.delete(socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(`\n  ✔ SSH Terminal ready → http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}\n`);
    });
});