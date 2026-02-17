"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore } from "@/store/session-store";
import { getSocket } from "@/lib/socket";
import { generateId } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { SSHConnectionConfig, SavedHost } from "@/lib/types";

interface ConnectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    prefill?: SavedHost | null;
}

export function ConnectionModal({
    open,
    onOpenChange,
    prefill,
}: ConnectionModalProps) {
    const addSession = useSessionStore((s) => s.addSession);
    const addSavedHost = useSessionStore((s) => s.addSavedHost);

    const [host, setHost] = React.useState("");
    const [port, setPort] = React.useState("22");
    const [username, setUsername] = React.useState("");
    const [authMethod, setAuthMethod] = React.useState<"password" | "privateKey">(
        "password",
    );
    const [password, setPassword] = React.useState("");
    const [privateKey, setPrivateKey] = React.useState("");
    const [passphrase, setPassphrase] = React.useState("");
    const [saveHost, setSaveHost] = React.useState(false);
    const [connecting, setConnecting] = React.useState(false);

    // Populate form when prefill changes
    React.useEffect(() => {
        if (prefill) {
            setHost(prefill.host);
            setPort(String(prefill.port));
            setUsername(prefill.username);
            setAuthMethod(prefill.authMethod);
        }
    }, [prefill]);

    function resetForm() {
        setHost("");
        setPort("22");
        setUsername("");
        setAuthMethod("password");
        setPassword("");
        setPrivateKey("");
        setPassphrase("");
        setSaveHost(false);
        setConnecting(false);
    }

    function handleConnect() {
        if (!host || !username) {
            toast({ title: "Validation error", description: "Host and Username are required.", variant: "destructive" });
            return;
        }

        setConnecting(true);
        const sessionId = generateId();
        const portNum = parseInt(port, 10) || 22;
        const label = `${username}@${host}`;

        const config: SSHConnectionConfig = {
            host,
            port: portNum,
            username,
            authMethod,
            password: authMethod === "password" ? password : undefined,
            privateKey: authMethod === "privateKey" ? privateKey : undefined,
            passphrase: authMethod === "privateKey" ? passphrase : undefined,
        };

        // Add session to store immediately (status: connecting)
        addSession({
            id: sessionId,
            label,
            host,
            port: portNum,
            username,
            status: "connecting",
        });

        // Optionally save the host
        if (saveHost) {
            addSavedHost({
                id: generateId(),
                label,
                host,
                port: portNum,
                username,
                authMethod,
            });
        }

        // Emit to backend
        const socket = getSocket();
        socket.emit("session:create", { sessionId, config });

        resetForm();
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Connection</DialogTitle>
                    <DialogDescription>
                        Enter the SSH credentials for the remote host.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Host + Port */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="host">Host</Label>
                            <Input
                                id="host"
                                placeholder="192.168.1.100"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="port">Port</Label>
                            <Input
                                id="port"
                                placeholder="22"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="root"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    {/* Auth method toggle */}
                    <div className="space-y-2">
                        <Label>Authentication</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant={authMethod === "password" ? "default" : "outline"}
                                onClick={() => setAuthMethod("password")}
                            >
                                Password
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={authMethod === "privateKey" ? "default" : "outline"}
                                onClick={() => setAuthMethod("privateKey")}
                            >
                                Private Key
                            </Button>
                        </div>
                    </div>

                    {/* Password field */}
                    {authMethod === "password" && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Private key fields */}
                    {authMethod === "privateKey" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="privateKey">Private Key (PEM)</Label>
                                <Textarea
                                    id="privateKey"
                                    rows={4}
                                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="passphrase">Passphrase (optional)</Label>
                                <Input
                                    id="passphrase"
                                    type="password"
                                    placeholder="Key passphrase"
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Save host checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-400">
                        <input
                            type="checkbox"
                            checked={saveHost}
                            onChange={(e) => setSaveHost(e.target.checked)}
                            className="rounded border-zinc-700 bg-black text-white focus:ring-zinc-600"
                        />
                        Save host for later
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConnect} disabled={connecting}>
                        {connecting ? "Connecting…" : "Connect"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}