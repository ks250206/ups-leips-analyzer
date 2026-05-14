import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import uPlot from "uplot";
import type { FitRange } from "../../domain/types";
import { alignSeries, type PlotMarker, type PlotRangeBand, type PlotSeries } from "../plotData";

interface SpectrumPlotProps {
  title: string;
  xLabel: string;
  yLabel: string;
  yRightLabel?: string;
  hideYTicks?: boolean;
  series: PlotSeries[];
  markers?: PlotMarker[];
  rangeBands?: PlotRangeBand[];
  xDirection?: "normal" | "reverse";
  onSelectRange?: (range: FitRange) => void;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
}

export interface SpectrumPlotOptionsInput {
  size: { width: number; height: number };
  title: string;
  xLabel: string;
  yLabel: string;
  yRightLabel?: string;
  hideYTicks?: boolean;
  series: PlotSeries[];
  markers: PlotMarker[];
  rangeBands: PlotRangeBand[];
  xDirection: "normal" | "reverse";
  onSelectRange?: (range: FitRange) => void;
  onSyncHandles?: (plot: uPlot) => void;
}

interface CursorHandle {
  bandId: string;
  side: "min" | "max";
  label: string;
  color: string;
  left: number;
  top: number;
  height: number;
}

interface PlotScaleRange {
  min: number;
  max: number;
}

interface PlotViewport {
  x?: PlotScaleRange;
  y?: PlotScaleRange;
  y2?: PlotScaleRange;
}

const EMPTY_MARKERS: PlotMarker[] = [];
const EMPTY_RANGE_BANDS: PlotRangeBand[] = [];

export function SpectrumPlot({
  title,
  xLabel,
  yLabel,
  yRightLabel,
  hideYTicks = false,
  series,
  markers = EMPTY_MARKERS,
  rangeBands = EMPTY_RANGE_BANDS,
  xDirection = "normal",
  onSelectRange,
  onRangeBandChange,
}: SpectrumPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | undefined>(undefined);
  const viewportRef = useRef<PlotViewport>({});
  const [handles, setHandles] = useState<CursorHandle[]>([]);
  const data = useMemo(() => alignSeries(series), [series]);
  const hasData = data[0].length > 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasData) {
      capturePlotViewport(plotRef.current, viewportRef);
      plotRef.current?.destroy();
      plotRef.current = undefined;
      clearHandles(setHandles);
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      const plot = plotRef.current;
      if (plot) {
        plot.setSize(sizeFor(container));
        syncHandles(plot, rangeBands, setHandles);
      }
    });

    const options = createSpectrumPlotOptions({
      size: sizeFor(container),
      title,
      xLabel,
      yLabel,
      yRightLabel,
      hideYTicks,
      series,
      markers,
      rangeBands,
      xDirection,
      onSelectRange,
      onSyncHandles: (plot) => syncHandles(plot, rangeBands, setHandles),
    });

    capturePlotViewport(plotRef.current, viewportRef);
    plotRef.current?.destroy();
    plotRef.current = new uPlot(options, data as uPlot.AlignedData, container);
    restorePlotViewport(plotRef.current, viewportRef.current);
    const detachPlotDrag = attachPlotInteractions(plotRef.current, {
      onSelectRange,
      onAfterScale: () => {
        const plot = plotRef.current;
        if (plot) {
          capturePlotViewport(plot, viewportRef);
          syncHandles(plot, rangeBands, setHandles);
        }
      },
    });
    resizeObserver.observe(container);

    return () => {
      detachPlotDrag();
      resizeObserver.disconnect();
      capturePlotViewport(plotRef.current, viewportRef);
      plotRef.current?.destroy();
      plotRef.current = undefined;
      clearHandles(setHandles);
    };
  }, [
    data,
    markers,
    onSelectRange,
    rangeBands,
    series,
    title,
    xDirection,
    xLabel,
    yLabel,
    yRightLabel,
    hideYTicks,
    hasData,
  ]);

  if (!hasData) {
    return (
      <div
        aria-label={`${title} plot`}
        className="flex h-full w-full items-center justify-center bg-white text-sm text-slate-500"
        data-x-direction={xDirection}
      >
        <div className="rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center">
          <div className="font-semibold text-slate-700">No data</div>
          <div className="mt-1 text-xs">Load CSV or Demo data to render this plot.</div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={`${title} plot`}
      className="relative h-full w-full bg-white"
      data-x-direction={xDirection}
    >
      <div ref={containerRef} className="h-full w-full" />
      {handles.map((handle) => (
        <button
          key={`${handle.bandId}-${handle.side}`}
          aria-label={`${handle.label} cursor`}
          className="absolute z-10 cursor-ew-resize border-0 bg-transparent p-0"
          style={{
            left: handle.left - 5,
            top: handle.top,
            height: handle.height,
            width: 10,
          }}
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            startHandleDrag(event, handle, plotRef, rangeBands, onRangeBandChange);
          }}
        >
          <span
            className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
            style={{ backgroundColor: handle.color }}
          />
          <span
            className="absolute left-1/2 top-1 -translate-x-1/2 rounded px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow"
            style={{ backgroundColor: handle.color }}
          >
            {handle.label}
          </span>
        </button>
      ))}
      <div className="absolute right-2 top-9 flex gap-1">
        <button
          className="rounded border border-slate-300 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm hover:bg-cyan-50"
          type="button"
          onClick={() => {
            viewportRef.current = {};
            resetZoom(plotRef.current, data[0], series);
            const plot = plotRef.current;
            if (plot) {
              syncHandles(plot, rangeBands, setHandles);
            }
          }}
        >
          Reset
        </button>
        <button
          className="rounded border border-slate-300 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm hover:bg-cyan-50"
          type="button"
          onClick={() => exportPng(plotRef.current, title)}
        >
          PNG
        </button>
        <button
          className="rounded border border-slate-300 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm hover:bg-cyan-50"
          type="button"
          onClick={() => exportSvg({ title, xLabel, yLabel, series, markers })}
        >
          SVG
        </button>
      </div>
    </div>
  );
}

export function createSpectrumPlotOptions(input: SpectrumPlotOptionsInput): uPlot.Options {
  const hasRightAxis = input.series.some((item) => item.yAxis === "right");
  return {
    ...input.size,
    cursor: {
      show: false,
      drag: {
        setScale: false,
        x: false,
        y: false,
      },
    },
    legend: { show: true },
    scales: {
      x: { time: false, dir: input.xDirection === "reverse" ? -1 : 1 },
      ...(hasRightAxis ? { y2: { auto: true } } : {}),
    },
    axes: [
      {
        label: input.xLabel,
        stroke: "#334155",
        size: 48,
        labelSize: 20,
        labelGap: 6,
        grid: { stroke: "#e2e8f0", width: 1 },
      },
      createYAxis({
        label: input.yLabel,
        stroke: "#334155",
        hideTicks: input.hideYTicks ?? false,
      }),
      ...(hasRightAxis
        ? [
            createYAxis({
              scale: "y2",
              side: 1,
              label: input.yRightLabel ?? "Right axis",
              stroke: "#dc2626",
              hideTicks: input.hideYTicks ?? false,
            }),
          ]
        : []),
    ],
    series: [
      {},
      ...input.series.map((item) => ({
        label: item.name,
        scale: item.yAxis === "right" ? "y2" : "y",
        stroke: item.color,
        width: item.width ?? 2,
        dash: item.dash,
        spanGaps: true,
        auto: item.affectsScale ?? true,
      })),
    ],
    hooks: {
      drawClear: [
        (plot) => {
          drawRangeBands(plot, input.rangeBands);
        },
      ],
      draw: [
        (plot) => {
          drawPlotBorder(plot);
          drawMarkers(plot, input.markers);
        },
      ],
      setScale: [
        (plot, scaleKey) => {
          if (scaleKey === "x") {
            input.onSyncHandles?.(plot);
          }
        },
      ],
      ready: [
        (plot) => {
          input.onSyncHandles?.(plot);
        },
      ],
    },
  };
}

function createYAxis(input: {
  label: string;
  stroke: string;
  hideTicks: boolean;
  scale?: string;
  side?: 1;
}): uPlot.Axis {
  return {
    scale: input.scale,
    side: input.side,
    label: input.label,
    stroke: input.stroke,
    size: input.side === 1 ? 66 : 78,
    labelSize: 20,
    labelGap: 8,
    grid: input.hideTicks ? { show: false } : { stroke: "#edf2f7", width: 1 },
    ticks: input.hideTicks ? { show: false } : undefined,
    values: input.hideTicks ? () => [] : undefined,
  };
}

function sizeFor(element: HTMLElement): { width: number; height: number } {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(260, Math.floor(rect.width)),
    height: Math.max(190, Math.floor(rect.height)),
  };
}

function drawMarkers(plot: uPlot, markers: readonly PlotMarker[]): void {
  if (markers.length === 0) {
    return;
  }
  const ctx = plot.ctx;
  const top = plot.bbox.top / devicePixelRatio;
  const left = plot.bbox.left / devicePixelRatio;
  const height = plot.bbox.height / devicePixelRatio;
  ctx.save();
  ctx.font = "12px Inter, sans-serif";
  ctx.textBaseline = "top";
  for (const marker of markers) {
    const x = left + plot.valToPos(marker.x, "x");
    ctx.strokeStyle = marker.color;
    ctx.fillStyle = marker.color;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(marker.label, x + 4, top + 6);
  }
  ctx.restore();
}

function drawPlotBorder(plot: uPlot): void {
  const ctx = plot.ctx;
  const top = plot.bbox.top / devicePixelRatio;
  const left = plot.bbox.left / devicePixelRatio;
  const width = plot.bbox.width / devicePixelRatio;
  const height = plot.bbox.height / devicePixelRatio;
  ctx.save();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  ctx.strokeRect(left, top, width, height);
  ctx.restore();
}

function drawRangeBands(plot: uPlot, rangeBands: readonly PlotRangeBand[]): void {
  if (rangeBands.length === 0) {
    return;
  }
  const ctx = plot.ctx;
  const top = plot.bbox.top / devicePixelRatio;
  const left = plot.bbox.left / devicePixelRatio;
  const height = plot.bbox.height / devicePixelRatio;
  ctx.save();
  ctx.font = "11px Inter, sans-serif";
  ctx.textBaseline = "top";
  for (const band of rangeBands) {
    const x0 = left + plot.valToPos(Math.min(band.min, band.max), "x");
    const x1 = left + plot.valToPos(Math.max(band.min, band.max), "x");
    const width = x1 - x0;
    ctx.fillStyle = withAlpha(band.color, 0.11);
    ctx.fillRect(x0, top, width, height);
    ctx.strokeStyle = withAlpha(band.color, 0.65);
    ctx.strokeRect(x0, top, width, height);
    ctx.fillStyle = band.color;
    ctx.fillText(band.label, x0 + 4, top + height - 18);
  }
  ctx.restore();
}

function syncHandles(
  plot: uPlot,
  rangeBands: readonly PlotRangeBand[],
  setHandles: Dispatch<SetStateAction<CursorHandle[]>>,
): void {
  const top = plot.bbox.top / devicePixelRatio;
  const left = plot.bbox.left / devicePixelRatio;
  const height = plot.bbox.height / devicePixelRatio;
  const nextHandles = rangeBands.flatMap((band): CursorHandle[] => {
    if (!band.id) {
      return [];
    }
    const [minLabel, maxLabel] = band.cursorLabels ?? ["A", "B"];
    return [
      {
        bandId: band.id,
        side: "min",
        label: minLabel,
        color: band.color,
        left: left + plot.valToPos(band.min, "x"),
        top,
        height,
      },
      {
        bandId: band.id,
        side: "max",
        label: maxLabel,
        color: band.color,
        left: left + plot.valToPos(band.max, "x"),
        top,
        height,
      },
    ];
  });
  setHandles((current) => (cursorHandlesEqual(current, nextHandles) ? current : nextHandles));
}

function clearHandles(setHandles: Dispatch<SetStateAction<CursorHandle[]>>): void {
  setHandles((current) => (current.length === 0 ? current : []));
}

function cursorHandlesEqual(
  leftHandles: readonly CursorHandle[],
  rightHandles: readonly CursorHandle[],
): boolean {
  if (leftHandles.length !== rightHandles.length) {
    return false;
  }
  return leftHandles.every((leftHandle, index) => {
    const rightHandle = rightHandles[index];
    return (
      rightHandle !== undefined &&
      leftHandle.bandId === rightHandle.bandId &&
      leftHandle.side === rightHandle.side &&
      leftHandle.label === rightHandle.label &&
      leftHandle.color === rightHandle.color &&
      almostEqual(leftHandle.left, rightHandle.left) &&
      almostEqual(leftHandle.top, rightHandle.top) &&
      almostEqual(leftHandle.height, rightHandle.height)
    );
  });
}

function almostEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.25;
}

function startHandleDrag(
  event: ReactPointerEvent<HTMLButtonElement>,
  handle: CursorHandle,
  plotRef: RefObject<uPlot | undefined>,
  rangeBands: readonly PlotRangeBand[],
  onRangeBandChange: ((bandId: string, range: FitRange) => void) | undefined,
): void {
  const plot = plotRef.current;
  const container = plot?.root.parentElement;
  const band = rangeBands.find((item) => item.id === handle.bandId);
  if (!plot || !container || !band || !onRangeBandChange) {
    return;
  }
  const pointerId = event.pointerId;
  event.currentTarget.setPointerCapture(pointerId);

  const move = (moveEvent: PointerEvent) => {
    const nextX = clientXToPlotValue(plot, container, moveEvent.clientX);
    const nextRange =
      handle.side === "min"
        ? normalizeRange({ min: nextX, max: band.max })
        : normalizeRange({ min: band.min, max: nextX });
    onRangeBandChange(handle.bandId, nextRange);
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

function clientXToPlotValue(plot: uPlot, container: HTMLElement, clientX: number): number {
  const rect = container.getBoundingClientRect();
  const plotLeft = plot.bbox.left / devicePixelRatio;
  const plotWidth = plot.bbox.width / devicePixelRatio;
  const position = Math.min(Math.max(clientX - rect.left - plotLeft, 0), plotWidth);
  return plot.posToVal(position, "x");
}

function normalizeRange(range: FitRange): FitRange {
  return { min: Math.min(range.min, range.max), max: Math.max(range.min, range.max) };
}

function attachPlotInteractions(
  plot: uPlot,
  input: {
    onSelectRange?: (range: FitRange) => void;
    onAfterScale: () => void;
  },
): () => void {
  const over = plot.over;
  let start: { left: number; top: number; shiftKey: boolean } | undefined;
  let isDragging = false;

  const handleMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    start = { ...eventPositionInPlot(plot, event), shiftKey: event.shiftKey };
    isDragging = false;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp, { once: true });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!start) {
      return;
    }
    const current = eventPositionInPlot(plot, event);
    const width = Math.abs(current.left - start.left);
    const height = Math.abs(current.top - start.top);
    if (width < 3 && height < 3) {
      return;
    }
    isDragging = true;
    event.preventDefault();
    const plotSize = plotSizeFromBbox(plot);
    plot.setSelect(selectionRectForMode(start, clampPlotPosition(current, plotSize), plotSize));
  };

  const handleMouseUp = (event: MouseEvent) => {
    document.removeEventListener("mousemove", handleMouseMove);
    const dragStart = start;
    start = undefined;
    if (!dragStart || !isDragging) {
      plot.setSelect({ left: 0, top: 0, width: 0, height: 0 });
      return;
    }
    const end = eventPositionInPlot(plot, event);
    plot.setSelect({ left: 0, top: 0, width: 0, height: 0 });
    if (dragStart.shiftKey && input.onSelectRange) {
      const from = plot.posToVal(Math.min(dragStart.left, end.left), "x");
      const to = plot.posToVal(Math.max(dragStart.left, end.left), "x");
      const range = normalizeRange({ min: from, max: to });
      input.onSelectRange(range);
      input.onAfterScale();
      return;
    }
    applyDragZoom(plot, dragStart, end);
    input.onAfterScale();
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (event.metaKey || event.ctrlKey) {
      zoomPlotAtWheel(plot, event);
    } else {
      panPlotByWheel(plot, event);
    }
    input.onAfterScale();
  };

  over.addEventListener("mousedown", handleMouseDown);
  over.addEventListener("wheel", handleWheel, { passive: false });
  return () => {
    over.removeEventListener("mousedown", handleMouseDown);
    over.removeEventListener("wheel", handleWheel);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };
}

function eventPositionInPlot(plot: uPlot, event: MouseEvent): { left: number; top: number } {
  const rect = plot.over.getBoundingClientRect();
  return { left: event.clientX - rect.left, top: event.clientY - rect.top };
}

function clampPlotPosition(
  position: { left: number; top: number },
  plotSize: { width: number; height: number },
): { left: number; top: number } {
  return {
    left: Math.min(Math.max(position.left, 0), plotSize.width),
    top: Math.min(Math.max(position.top, 0), plotSize.height),
  };
}

function plotSizeFromBbox(plot: uPlot): { width: number; height: number } {
  return {
    width: plot.bbox.width / devicePixelRatio,
    height: plot.bbox.height / devicePixelRatio,
  };
}

export function inferPlotDragZoomMode(width: number, height: number): "x" | "y" | "xy" | undefined {
  const minDrag = 8;
  const dominanceRatio = 2.5;
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

function applyDragZoom(
  plot: uPlot,
  start: { left: number; top: number },
  end: { left: number; top: number },
): void {
  const width = Math.abs(end.left - start.left);
  const height = Math.abs(end.top - start.top);
  const mode = inferPlotDragZoomMode(width, height);
  if (!mode) {
    return;
  }
  const currentX = plotScaleRange(plot.scales.x);
  const currentY = plotScaleRange(plot.scales.y);
  const currentY2 = plotScaleRange(plot.scales.y2);
  plot.batch(() => {
    if (mode === "x" || mode === "xy") {
      setScaleRange(plot, "x", plot.posToVal(start.left, "x"), plot.posToVal(end.left, "x"));
    } else if (currentX) {
      plot.setScale("x", currentX);
    }
    if (mode === "y" || mode === "xy") {
      setScaleRange(plot, "y", plot.posToVal(start.top, "y"), plot.posToVal(end.top, "y"));
      if (plot.scales.y2) {
        setScaleRange(plot, "y2", plot.posToVal(start.top, "y2"), plot.posToVal(end.top, "y2"));
      }
    } else {
      if (currentY) {
        plot.setScale("y", currentY);
      }
      if (currentY2) {
        plot.setScale("y2", currentY2);
      }
    }
  });
}

function panPlotByWheel(plot: uPlot, event: WheelEvent): void {
  if (event.shiftKey) {
    const currentX = plotScaleRange(plot.scales.x);
    if (!currentX) {
      return;
    }
    const span = currentX.max - currentX.min;
    const direction = plot.scales.x.dir === -1 ? -1 : 1;
    const delta = (event.deltaY || event.deltaX) * span * 0.001 * direction;
    plot.setScale("x", { min: currentX.min + delta, max: currentX.max + delta });
    return;
  }
  panScaleByWheel(plot, "y", event.deltaY);
  if (plot.scales.y2) {
    panScaleByWheel(plot, "y2", event.deltaY);
  }
}

function panScaleByWheel(plot: uPlot, scaleKey: "y" | "y2", deltaY: number): void {
  const current = plotScaleRange(plot.scales[scaleKey]);
  if (!current) {
    return;
  }
  const span = current.max - current.min;
  const delta = deltaY * span * 0.001;
  plot.setScale(scaleKey, { min: current.min + delta, max: current.max + delta });
}

function zoomPlotAtWheel(plot: uPlot, event: WheelEvent): void {
  const factor = Math.exp(event.deltaY * 0.001);
  const position = eventPositionInPlot(plot, event);
  zoomScaleAt(plot, "x", plot.posToVal(position.left, "x"), factor);
  zoomScaleAt(plot, "y", plot.posToVal(position.top, "y"), factor);
  if (plot.scales.y2) {
    zoomScaleAt(plot, "y2", plot.posToVal(position.top, "y2"), factor);
  }
}

function zoomScaleAt(
  plot: uPlot,
  scaleKey: "x" | "y" | "y2",
  anchor: number,
  factor: number,
): void {
  const current = plotScaleRange(plot.scales[scaleKey]);
  if (!current || !Number.isFinite(anchor)) {
    return;
  }
  plot.setScale(scaleKey, {
    min: anchor - (anchor - current.min) * factor,
    max: anchor + (current.max - anchor) * factor,
  });
}

function setScaleRange(
  plot: uPlot,
  scaleKey: "x" | "y" | "y2",
  first: number,
  second: number,
): void {
  if (!Number.isFinite(first) || !Number.isFinite(second) || Math.abs(first - second) < 1e-12) {
    return;
  }
  plot.setScale(scaleKey, { min: Math.min(first, second), max: Math.max(first, second) });
}

function plotScaleRange(
  scale: Pick<uPlot.Scale, "min" | "max"> | undefined,
): PlotScaleRange | undefined {
  const min = Number(scale?.min);
  const max = Number(scale?.max);
  return Number.isFinite(min) && Number.isFinite(max) && min < max ? { min, max } : undefined;
}

function capturePlotViewport(
  plot: uPlot | undefined,
  viewportRef: { current: PlotViewport },
): void {
  if (!plot) {
    return;
  }
  viewportRef.current = {
    x: plotScaleRange(plot.scales.x),
    y: plotScaleRange(plot.scales.y),
    y2: plotScaleRange(plot.scales.y2),
  };
}

function restorePlotViewport(plot: uPlot, viewport: PlotViewport): void {
  plot.batch(() => {
    if (viewport.x) {
      plot.setScale("x", viewport.x);
    }
    if (viewport.y) {
      plot.setScale("y", viewport.y);
    }
    if (viewport.y2 && plot.scales.y2) {
      plot.setScale("y2", viewport.y2);
    }
  });
}

function resetZoom(
  plot: uPlot | undefined,
  xValues: readonly number[],
  series: readonly PlotSeries[],
): void {
  const min = xValues[0];
  const max = xValues[xValues.length - 1];
  if (!plot || min === undefined || max === undefined) {
    return;
  }
  const leftY = yExtent(series.filter((item) => item.yAxis !== "right"));
  const rightY = yExtent(series.filter((item) => item.yAxis === "right"));
  plot.batch(() => {
    plot.setScale("x", { min, max });
    if (leftY) {
      plot.setScale("y", leftY);
    }
    if (rightY && plot.scales.y2) {
      plot.setScale("y2", rightY);
    }
  });
}

function yExtent(series: readonly PlotSeries[]): PlotScaleRange | undefined {
  const values = series
    .filter((item) => item.affectsScale ?? true)
    .flatMap((item) => item.points.map((point) => point.y))
    .filter(Number.isFinite);
  if (values.length === 0) {
    return undefined;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.05, 1e-9);
  return { min: min - padding, max: max + padding };
}

function exportPng(plot: uPlot | undefined, title: string): void {
  const canvas = plot?.ctx.canvas;
  if (!canvas) {
    return;
  }
  download(`${safeName(title)}.png`, canvas.toDataURL("image/png"));
}

function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith("#") || color.length !== 7) {
    return color;
  }
  const r = Number.parseInt(color.slice(1, 3), 16);
  const g = Number.parseInt(color.slice(3, 5), 16);
  const b = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function exportSvg(input: {
  title: string;
  xLabel: string;
  yLabel: string;
  series: readonly PlotSeries[];
  markers: readonly PlotMarker[];
}): void {
  const width = 960;
  const height = 600;
  const margin = { top: 48, right: 28, bottom: 72, left: 76 };
  const allPoints = input.series.flatMap((item) => item.points);
  if (allPoints.length === 0) {
    return;
  }
  const minX = Math.min(...allPoints.map((point) => point.x));
  const maxX = Math.max(...allPoints.map((point) => point.x));
  const minY = Math.min(...allPoints.map((point) => point.y));
  const maxY = Math.max(...allPoints.map((point) => point.y));
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const sx = (x: number) => margin.left + ((x - minX) / Math.max(maxX - minX, 1e-9)) * plotWidth;
  const sy = (y: number) =>
    margin.top + plotHeight - ((y - minY) / Math.max(maxY - minY, 1e-9)) * plotHeight;

  const lines = input.series
    .map((item) => {
      const points = item.points
        .map((point) => `${sx(point.x).toFixed(2)},${sy(point.y).toFixed(2)}`)
        .join(" ");
      const dash = item.dash ? ` stroke-dasharray="${item.dash.join(" ")}"` : "";
      return `<polyline fill="none" stroke="${item.color}" stroke-width="${item.width ?? 2}"${dash} points="${points}" />`;
    })
    .join("\n");
  const markerLines = input.markers
    .map((marker) => {
      const x = sx(marker.x);
      return `<line x1="${x.toFixed(2)}" y1="${margin.top}" x2="${x.toFixed(2)}" y2="${margin.top + plotHeight}" stroke="${marker.color}" stroke-dasharray="5 4" /><text x="${(x + 6).toFixed(2)}" y="${margin.top + 18}" fill="${marker.color}" font-size="14">${escapeXml(marker.label)}</text>`;
    })
    .join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="white" />
<text x="${margin.left}" y="28" font-family="Inter, sans-serif" font-size="20" font-weight="700" fill="#0f172a">${escapeXml(input.title)}</text>
<rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}" fill="none" stroke="#334155" />
${lines}
${markerLines}
<text x="${margin.left + plotWidth / 2}" y="${height - 24}" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" fill="#334155">${escapeXml(input.xLabel)}</text>
<text x="24" y="${margin.top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 24 ${margin.top + plotHeight / 2})" font-family="Inter, sans-serif" font-size="16" fill="#334155">${escapeXml(input.yLabel)}</text>
</svg>`;
  download(
    `${safeName(input.title)}.svg`,
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  );
}

function download(filename: string, href: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}

function safeName(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "plot"
  );
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
