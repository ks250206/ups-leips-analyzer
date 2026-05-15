import { create } from "zustand";

type ToastTone = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastStore {
  messages: ToastMessage[];
  dismissToast: (id: number) => void;
  pushToast: (message: string, tone?: ToastTone) => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastStore>((set, get) => ({
  messages: [],
  dismissToast: (id) => {
    set((state) => ({ messages: state.messages.filter((message) => message.id !== id) }));
  },
  pushToast: (message, tone = "info") => {
    const id = nextToastId;
    nextToastId += 1;
    set((state) => ({ messages: [...state.messages, { id, message, tone }] }));
    window.setTimeout(() => get().dismissToast(id), 3600);
  },
}));

export function ToastViewport() {
  const messages = useToastStore((state) => state.messages);
  const dismissToast = useToastStore((state) => state.dismissToast);
  if (messages.length === 0) {
    return null;
  }
  return (
    <div className="pointer-events-none fixed right-4 top-14 z-[9999] flex w-80 flex-col gap-2">
      {messages.map((toast) => (
        <button
          key={toast.id}
          className={`pointer-events-auto rounded border px-3 py-2 text-left text-xs shadow-lg ${toneClass(
            toast.tone,
          )}`}
          type="button"
          onClick={() => dismissToast(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}

function toneClass(tone: ToastTone): string {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "error":
      return "border-red-200 bg-red-50 text-red-950";
    default:
      return "border-slate-200 bg-white text-slate-900";
  }
}
