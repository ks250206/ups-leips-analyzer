import { create } from "zustand";

export type CursorStyle = "point" | "range" | "reels-bg-single";

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
    case "reels-bg-single":
      return "Point cursor + REELS BG single point";
    default:
      return "Point cursor";
  }
}
