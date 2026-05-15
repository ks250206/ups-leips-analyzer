import type { PointerEvent as ReactPointerEvent } from "react";
import type { ScaleLinear } from "d3-scale";
import type { FitRange } from "../../domain/types";
import type { PlotRangeBand } from "../plotData";
import type { DragState, PlotGeometry, PlotScales, PlotViewport } from "./SpectrumPlotScales";
import {
  currentViewportForScales,
  eventPositionInPlot,
  isInsidePlot,
  nextViewportAfterPanDrag,
  normalizeRange,
  rangeAfterCursorDrag,
  shiftRangeByDelta,
} from "./SpectrumPlotViewport";

export function startPlotDrag(
  event: ReactPointerEvent<SVGSVGElement>,
  geometry: PlotGeometry,
  setDrag: (drag: DragState | undefined) => void,
  onComplete: (
    start: { left: number; top: number },
    end: { left: number; top: number },
    shiftKey: boolean,
  ) => void,
): void {
  if (event.button !== 0 || !isInsidePlot(eventPositionInPlot(event, geometry), geometry)) {
    return;
  }
  const svg = event.currentTarget;
  const start = eventPositionInPlot(event, geometry);
  let current = start;
  let moved = false;
  const shiftKey = event.shiftKey;
  setDrag({ start, current, shiftKey });

  const move = (moveEvent: PointerEvent) => {
    current = eventPositionInPlot(moveEvent, geometry, svg);
    moved =
      moved || Math.abs(current.left - start.left) >= 3 || Math.abs(current.top - start.top) >= 3;
    setDrag({ start, current, shiftKey });
  };
  const cleanup = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
    setDrag(undefined);
  };
  const cancel = () => cleanup();
  const up = (upEvent: PointerEvent) => {
    current = eventPositionInPlot(upEvent, geometry, svg);
    cleanup();
    if (moved) {
      onComplete(start, current, shiftKey);
    }
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up, { once: true });
  window.addEventListener("pointercancel", cancel, { once: true });
}

export function startPlotPan(
  event: ReactPointerEvent<SVGSVGElement>,
  geometry: PlotGeometry,
  scales: PlotScales,
  updateViewport: (next: PlotViewport | ((current: PlotViewport) => PlotViewport)) => void,
): void {
  if (event.button !== 0 || !isInsidePlot(eventPositionInPlot(event, geometry), geometry)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const svg = event.currentTarget;
  const start = eventPositionInPlot(event, geometry);
  const startViewport = currentViewportForScales(scales);
  const move = (moveEvent: PointerEvent) => {
    const current = eventPositionInPlot(moveEvent, geometry, svg);
    updateViewport(nextViewportAfterPanDrag(startViewport, scales, start, current));
  };
  const cleanup = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", cleanup);
    window.removeEventListener("pointercancel", cleanup);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", cleanup, { once: true });
  window.addEventListener("pointercancel", cleanup, { once: true });
}

export function startHandleDrag(
  event: ReactPointerEvent<SVGRectElement>,
  geometry: PlotGeometry,
  xScale: ScaleLinear<number, number>,
  band: PlotRangeBand,
  side: "min" | "max",
  onRangeBandChange: ((bandId: string, range: FitRange) => void) | undefined,
): void {
  if (!band.id || !onRangeBandChange) {
    return;
  }
  const svg = event.currentTarget.ownerSVGElement;
  if (!svg) {
    return;
  }
  const move = (moveEvent: PointerEvent) => {
    const position = eventPositionInPlot(moveEvent, geometry, svg);
    const nextX = xScale.invert(geometry.left + position.left);
    onRangeBandChange(band.id ?? "", rangeAfterCursorDrag(band, side, nextX));
  };
  const cleanup = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", cleanup);
    window.removeEventListener("pointercancel", cleanup);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", cleanup, { once: true });
  window.addEventListener("pointercancel", cleanup, { once: true });
}

export function startRangeBandDrag(
  event: ReactPointerEvent<SVGRectElement>,
  geometry: PlotGeometry,
  xScale: ScaleLinear<number, number>,
  band: PlotRangeBand,
  onRangeBandChange: ((bandId: string, range: FitRange) => void) | undefined,
): void {
  if (!band.id || !onRangeBandChange) {
    return;
  }
  const svg = event.currentTarget.ownerSVGElement;
  if (!svg) {
    return;
  }
  const startPosition = eventPositionInPlot(event, geometry, svg);
  const startValue = xScale.invert(geometry.left + startPosition.left);
  const initialRange = normalizeRange({ min: band.min, max: band.max });
  const move = (moveEvent: PointerEvent) => {
    const position = eventPositionInPlot(moveEvent, geometry, svg);
    const nextValue = xScale.invert(geometry.left + position.left);
    onRangeBandChange(band.id ?? "", shiftRangeByDelta(initialRange, nextValue - startValue));
  };
  const cleanup = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", cleanup);
    window.removeEventListener("pointercancel", cleanup);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", cleanup, { once: true });
  window.addEventListener("pointercancel", cleanup, { once: true });
}
