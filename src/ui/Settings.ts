import { create } from "zustand";

export type CursorStyle = "point" | "range";

interface SettingsState {
  cursorStyle: CursorStyle;
  setCursorStyle: (style: CursorStyle) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  cursorStyle: "point",
  setCursorStyle: (cursorStyle) => set({ cursorStyle }),
}));

export function cursorStyleLabel(style: CursorStyle): string {
  switch (style) {
    case "range":
      return "Range cursor";
    default:
      return "Point cursor";
  }
}
