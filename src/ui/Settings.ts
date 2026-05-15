import type { CursorStyle } from "../store/projectTypes";

export type { CursorStyle };

export function cursorStyleLabel(style: CursorStyle): string {
  switch (style) {
    case "range":
      return "Range cursor";
    default:
      return "Point cursor";
  }
}
