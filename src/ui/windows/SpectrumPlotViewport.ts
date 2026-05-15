import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import type { FitRange } from "../../domain/types";
import type { PlotRangeBand, PlotSeries } from "../plotData";
import type { PlotGeometry, PlotScaleRange, PlotScales, PlotViewport } from "./SpectrumPlotScales";

export function eventPositionInPlot(
  event: Pick<
    | PointerEvent
    | ReactPointerEvent<SVGSVGElement>
    | ReactPointerEvent<SVGRectElement>
    | ReactWheelEvent<SVGSVGElement>
    | WheelEvent,
    "clientX" | "clientY" | "currentTarget"
  >,
  geometry: PlotGeometry,
  svgElement?: SVGSVGElement,
): { left: number; top: number } {
  const target =
    svgElement ?? (event.currentTarget instanceof SVGSVGElement ? event.currentTarget : undefined);
  const rect = target?.getBoundingClientRect() ?? {
    left: 0,
    top: 0,
    width: geometry.width,
    height: geometry.height,
  };
  const scaleX = geometry.width / Math.max(rect.width, 1);
  const scaleY = geometry.height / Math.max(rect.height, 1);
  return {
    left: (event.clientX - rect.left) * scaleX - geometry.left,
    top: (event.clientY - rect.top) * scaleY - geometry.top,
  };
}

export function isInsidePlot(position: { left: number; top: number }, geometry: PlotGeometry) {
  return (
    position.left >= 0 &&
    position.left <= geometry.plotWidth &&
    position.top >= 0 &&
    position.top <= geometry.plotHeight
  );
}

export function clampPlotPosition(
  position: { left: number; top: number },
  geometry: PlotGeometry,
): { left: number; top: number } {
  return {
    left: Math.min(Math.max(position.left, 0), geometry.plotWidth),
    top: Math.min(Math.max(position.top, 0), geometry.plotHeight),
  };
}

export function inferPlotDragZoomMode(width: number, height: number): "x" | "y" | "xy" | undefined {
  const minDrag = 8;
  const dominanceRatio = 6;
  const absWidth = Math.abs(width);
  const absHeight = Math.abs(height);
  const hasWidth = absWidth >= minDrag;
  const hasHeight = absHeight >= minDrag;
  if (!hasWidth && !hasHeight) {
    return undefined;
  }
  if (hasWidth && !hasHeight) {
    return "x";
  }
  if (hasHeight && !hasWidth) {
    return "y";
  }
  if (absWidth / Math.max(absHeight, 1) >= dominanceRatio) {
    return "x";
  }
  if (absHeight / Math.max(absWidth, 1) >= dominanceRatio) {
    return "y";
  }
  return "xy";
}

export function selectionRectForMode(
  start: { left: number; top: number },
  end: { left: number; top: number },
  plotSize: { width: number; height: number },
): { left: number; top: number; width: number; height: number } {
  const width = Math.abs(end.left - start.left);
  const height = Math.abs(end.top - start.top);
  const mode = inferPlotDragZoomMode(width, height);
  const horizontal = { left: Math.min(start.left, end.left), width };
  const vertical = { top: Math.min(start.top, end.top), height };
  if (mode === "x") {
    return { ...horizontal, top: 0, height: plotSize.height };
  }
  if (mode === "y") {
    return { left: 0, width: plotSize.width, ...vertical };
  }
  return { ...horizontal, ...vertical };
}

export function rangeAfterCursorDrag(
  band: Pick<PlotRangeBand, "min" | "max">,
  side: "min" | "max",
  value: number,
): FitRange {
  return side === "min"
    ? normalizeRange({ min: value, max: band.max })
    : normalizeRange({ min: band.min, max: value });
}

export function shiftRangeByDelta(range: FitRange, delta: number): FitRange {
  return { min: range.min + delta, max: range.max + delta };
}

export function plotXToValue(
  scales: Pick<PlotScales, "geometry" | "xScale">,
  left: number,
): number {
  return scales.xScale.invert(scales.geometry.left + left);
}

export function plotYToValue(scales: Pick<PlotScales, "geometry" | "yScale">, top: number): number {
  return scales.yScale.invert(scales.geometry.top + top);
}

export function plotY2ToValue(
  scales: Pick<PlotScales, "geometry" | "yRightScale">,
  top: number,
): number | undefined {
  return scales.yRightScale?.invert(scales.geometry.top + top);
}

export function nextViewportAfterDrag(
  current: PlotViewport,
  scales: PlotScales,
  start: { left: number; top: number },
  end: { left: number; top: number },
): PlotViewport {
  const mode = inferPlotDragZoomMode(end.left - start.left, end.top - start.top);
  if (!mode) {
    return current;
  }
  return {
    x:
      mode === "x" || mode === "xy"
        ? normalizeRange({
            min: plotXToValue(scales, start.left),
            max: plotXToValue(scales, end.left),
          })
        : current.x,
    y:
      mode === "y" || mode === "xy"
        ? normalizeRange({
            min: plotYToValue(scales, start.top),
            max: plotYToValue(scales, end.top),
          })
        : current.y,
    y2:
      scales.yRightScale && (mode === "y" || mode === "xy")
        ? normalizeRange({
            min: plotY2ToValue(scales, start.top) ?? current.y2?.min ?? 0,
            max: plotY2ToValue(scales, end.top) ?? current.y2?.max ?? 1,
          })
        : current.y2,
  };
}

export function nextViewportAfterWheel(
  current: PlotViewport,
  scales: PlotScales,
  event: Pick<
    WheelEvent | ReactWheelEvent<SVGSVGElement>,
    "clientX" | "clientY" | "currentTarget" | "altKey" | "shiftKey" | "deltaX" | "deltaY"
  >,
  xDirection: "normal" | "reverse",
  svgElement?: SVGSVGElement,
): PlotViewport {
  const position = eventPositionInPlot(event, scales.geometry, svgElement);
  const x = current.x ?? scales.xDomain;
  const y = current.y ?? scales.yDomain;
  const y2 = current.y2 ?? scales.yRightDomain;
  const horizontalWheel = isHorizontalWheel(event);
  if (event.altKey && (event.shiftKey || horizontalWheel)) {
    const deltaSource = event.deltaY || event.deltaX;
    const direction = xDirection === "reverse" ? -1 : 1;
    const delta = deltaSource * (x.max - x.min) * 0.001 * direction;
    return { ...current, x: { min: x.min + delta, max: x.max + delta } };
  }
  if (event.altKey) {
    const yDelta = event.deltaY * (y.max - y.min) * 0.001;
    const nextY2Delta = y2 ? event.deltaY * (y2.max - y2.min) * 0.001 : 0;
    return {
      ...current,
      y: { min: y.min + yDelta, max: y.max + yDelta },
      y2: y2 ? { min: y2.min + nextY2Delta, max: y2.max + nextY2Delta } : undefined,
    };
  }
  if (event.shiftKey || horizontalWheel) {
    const xWheelDelta = event.deltaY || event.deltaX;
    const factor = Math.exp(xWheelDelta * 0.001);
    return {
      ...current,
      x: zoomRangeAt(x, plotXToValue(scales, position.left), factor),
    };
  }
  const factor = Math.exp(event.deltaY * 0.001);
  const y2Anchor = plotY2ToValue(scales, position.top);
  return {
    ...current,
    y: zoomRangeAt(y, plotYToValue(scales, position.top), factor),
    y2: y2 && y2Anchor !== undefined ? zoomRangeAt(y2, y2Anchor, factor) : y2,
  };
}

function isHorizontalWheel(
  event: Pick<WheelEvent | ReactWheelEvent<SVGSVGElement>, "deltaX" | "deltaY">,
) {
  return Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.2;
}

export function nextViewportAfterPanDrag(
  current: PlotViewport,
  scales: PlotScales,
  start: { left: number; top: number },
  end: { left: number; top: number },
): PlotViewport {
  const x = current.x ?? scales.xDomain;
  const y = current.y ?? scales.yDomain;
  const y2 = current.y2 ?? scales.yRightDomain;
  const xDelta = plotXToValue(scales, start.left) - plotXToValue(scales, end.left);
  const yDelta = plotYToValue(scales, start.top) - plotYToValue(scales, end.top);
  const y2Start = plotY2ToValue(scales, start.top);
  const y2End = plotY2ToValue(scales, end.top);
  const y2Delta = y2Start !== undefined && y2End !== undefined ? y2Start - y2End : 0;
  return {
    x: { min: x.min + xDelta, max: x.max + xDelta },
    y: { min: y.min + yDelta, max: y.max + yDelta },
    y2: y2 ? { min: y2.min + y2Delta, max: y2.max + y2Delta } : undefined,
  };
}

export function currentViewportForScales(scales: PlotScales): PlotViewport {
  return {
    x: scales.xDomain,
    y: scales.yDomain,
    y2: scales.yRightDomain,
  };
}

export function zoomRangeAt(range: PlotScaleRange, anchor: number, factor: number): PlotScaleRange {
  if (!Number.isFinite(anchor)) {
    return range;
  }
  return {
    min: anchor - (anchor - range.min) * factor,
    max: anchor + (range.max - anchor) * factor,
  };
}

export function shouldRenderSeriesInXDomain(
  series: Pick<PlotSeries, "fitRange">,
  visibleXDomain: PlotScaleRange,
): boolean {
  if (!series.fitRange) {
    return true;
  }
  const min = Math.min(series.fitRange.min, series.fitRange.max);
  const max = Math.max(series.fitRange.min, series.fitRange.max);
  return max >= visibleXDomain.min && min <= visibleXDomain.max;
}

export function normalizeRange(range: FitRange): FitRange {
  return { min: Math.min(range.min, range.max), max: Math.max(range.min, range.max) };
}

export function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith("#") || color.length !== 7) {
    return color;
  }
  const r = Number.parseInt(color.slice(1, 3), 16);
  const g = Number.parseInt(color.slice(3, 5), 16);
  const b = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
