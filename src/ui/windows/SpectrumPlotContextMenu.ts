import type { RefObject } from "react";
import type { ContextMenuItem } from "../ContextMenu";
import { useContextMenu } from "../ContextMenu";
import { cursorStyleLabel, type CursorStyle } from "../Settings";
import { copyPng, exportPng, exportSvg } from "./plotExport";

export function useSpectrumPlotContextMenu({
  cursorStyle,
  extraContextMenuItems,
  hasData,
  onCursorStyleChange,
  resetViewport,
  setShowCursorRanges,
  showCursorRanges,
  svgRef,
  title,
}: {
  cursorStyle: CursorStyle;
  extraContextMenuItems: ContextMenuItem[];
  hasData: boolean;
  onCursorStyleChange?: (style: CursorStyle) => void;
  resetViewport: () => void;
  setShowCursorRanges: (update: (current: boolean) => boolean) => void;
  showCursorRanges: boolean;
  svgRef: RefObject<SVGSVGElement | null>;
  title: string;
}) {
  const { menu, openMenu, closeMenu } = useContextMenu();
  const openPlotContextMenu = (x: number, y: number) =>
    openMenu(x, y, [
      ...(extraContextMenuItems.length > 0
        ? ([...extraContextMenuItems, { type: "separator" }] as ContextMenuItem[])
        : []),
      {
        type: "item",
        label: showCursorRanges ? "Hide cursor ranges" : "Show cursor ranges",
        action: () => setShowCursorRanges((current) => !current),
      },
      ...(showCursorRanges
        ? ([
            {
              type: "submenu",
              label: "Cursor style",
              items: cursorStyleItems(cursorStyle, onCursorStyleChange),
            },
          ] as ContextMenuItem[])
        : []),
      { type: "item", label: "Reset view", action: resetViewport },
      {
        type: "item",
        label: "Copy PNG",
        action: () => copyPng(svgRef.current),
        disabled: !hasData,
      },
      {
        type: "item",
        label: "Export PNG",
        action: () => exportPng(svgRef.current, title),
        disabled: !hasData,
      },
      {
        type: "item",
        label: "Export SVG",
        action: () => exportSvg(svgRef.current, title),
        disabled: !hasData,
      },
    ]);
  return { closeMenu, menu, openPlotContextMenu };
}

const cursorStyles: readonly CursorStyle[] = ["point", "range"];

function cursorStyleItems(
  cursorStyle: CursorStyle,
  setCursorStyle: ((style: CursorStyle) => void) | undefined,
): ContextMenuItem[] {
  return cursorStyles.map((style) => ({
    type: "item",
    label: `${cursorStyle === style ? "✓ " : ""}${cursorStyleLabel(style)}`,
    action: () => setCursorStyle?.(style),
  }));
}
