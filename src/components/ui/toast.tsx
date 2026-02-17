"use client";

import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
    const { toasts, dismiss } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={cn(
                        "pointer-events-auto rounded-lg border px-4 py-3 shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300",
                        t.variant === "destructive"
                            ? "border-red-900 bg-red-950 text-red-100"
                            : "border-zinc-800 bg-zinc-950 text-zinc-100",
                    )}
                >
                    <div className="flex-1 space-y-1">
                        {t.title && <p className="text-sm font-semibold">{t.title}</p>}
                        {t.description && (
                            <p className="text-sm text-zinc-400">{t.description}</p>
                        )}
                    </div>
                    <button
                        onClick={() => dismiss(t.id)}
                        className="shrink-0 text-zinc-500 hover:text-zinc-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}