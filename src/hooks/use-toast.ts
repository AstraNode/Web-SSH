"use client";

import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

type ToastVariant = "default" | "destructive";

export interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: ToastVariant;
}

let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}

type Action =
    | { type: "ADD"; toast: Toast }
    | { type: "DISMISS"; id: string }
    | { type: "REMOVE"; id: string };

interface State {
    toasts: Toast[];
}

const listeners: Array<(s: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
    switch (action.type) {
        case "ADD":
            memoryState = {
                toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
            };
            break;
        case "DISMISS":
            memoryState = {
                toasts: memoryState.toasts.filter((t) => t.id !== action.id),
            };
            break;
        case "REMOVE":
            memoryState = {
                toasts: memoryState.toasts.filter((t) => t.id !== action.id),
            };
            break;
    }
    listeners.forEach((l) => l(memoryState));
}

export function toast(props: Omit<Toast, "id">) {
    const id = genId();
    dispatch({ type: "ADD", toast: { ...props, id } });
    setTimeout(() => dispatch({ type: "REMOVE", id }), TOAST_REMOVE_DELAY);
    return id;
}

export function useToast() {
    const [state, setState] = React.useState<State>(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const idx = listeners.indexOf(setState);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);

    return {
        toasts: state.toasts,
        toast,
        dismiss: (id: string) => dispatch({ type: "DISMISS", id }),
    };
}