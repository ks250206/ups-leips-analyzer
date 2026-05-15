import { create } from "zustand";

export type CursorStyle = "point" | "range";

const SETTINGS_STORAGE_KEY = "ups-leips-analyzer-settings";

interface SettingsState {
  cursorStyle: CursorStyle;
  setCursorStyle: (style: CursorStyle) => void;
}

function loadCursorStyle(): CursorStyle {
  if (typeof localStorage === "undefined") {
    return "point";
  }
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}") as {
      cursorStyle?: CursorStyle;
    };
    return stored.cursorStyle === "range" ? "range" : "point";
  } catch {
    return "point";
  }
}

function saveCursorStyle(cursorStyle: CursorStyle): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ cursorStyle }));
}

export const useSettingsStore = create<SettingsState>((set) => ({
  cursorStyle: loadCursorStyle(),
  setCursorStyle: (cursorStyle) => {
    saveCursorStyle(cursorStyle);
    set({ cursorStyle });
  },
}));

export function cursorStyleLabel(style: CursorStyle): string {
  switch (style) {
    case "range":
      return "Range cursor";
    default:
      return "Point cursor";
  }
}
