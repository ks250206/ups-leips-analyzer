import type { RefObject } from "react";
import { ContextMenu, type ContextMenuState } from "../ContextMenu";
import type { DragState, PlotGeometry } from "./SpectrumPlotModel";

export function NoDataPlot({
  containerRef,
  menu,
  onCloseMenu,
  onOpenMenu,
  title,
  xDirection,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  menu: ContextMenuState | undefined;
  onCloseMenu: () => void;
  onOpenMenu: (x: number, y: number) => void;
  title: string;
  xDirection: "normal" | "reverse";
}) {
  return (
    <div
      ref={containerRef}
      aria-label={`${title} plot`}
      className="relative flex h-full w-full items-center justify-center bg-white text-sm text-slate-500"
      data-plot-host="true"
      data-x-direction={xDirection}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenMenu(event.clientX, event.clientY);
      }}
      onPointerDown={(event) => {
        if (event.button === 2) {
          event.preventDefault();
          onOpenMenu(event.clientX, event.clientY);
        }
      }}
    >
      <div className="rounded border border-slate-300 bg-slate-50 px-4 py-3 text-center">
        <div className="font-semibold text-slate-700">No data</div>
        <div className="mt-1 text-xs">Load CSV data to render this plot.</div>
      </div>
      <ContextMenu menu={menu} onClose={onCloseMenu} />
    </div>
  );
}

export function SelectionOverlay({
  drag,
  geometry,
  selection,
}: {
  drag: DragState | undefined;
  geometry: PlotGeometry;
  selection: { left: number; top: number; width: number; height: number } | undefined;
}) {
  if (!selection) {
    return null;
  }
  return (
    <rect
      fill={drag?.shiftKey ? "rgba(14, 165, 233, 0.08)" : "rgba(15, 23, 42, 0.07)"}
      height={selection.height}
      pointerEvents="none"
      stroke={drag?.shiftKey ? "#0284c7" : "#475569"}
      width={selection.width}
      x={geometry.left + selection.left}
      y={geometry.top + selection.top}
    />
  );
}
