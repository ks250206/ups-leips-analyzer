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
  const [handles, setHandles] = useState<CursorHandle[]>([]);
  const data = useMemo(() => alignSeries(series), [series]);
  const hasData = data[0].length > 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasData) {
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

    plotRef.current?.destroy();
    plotRef.current = new uPlot(options, data as uPlot.AlignedData, container);
    const detachPlotDrag = attachPlotDrag(plotRef.current, {
      onSelectRange,
      onAfterScale: () => {
        const plot = plotRef.current;
        if (plot) {
          syncHandles(plot, rangeBands, setHandles);
        }
      },
    });
    resizeObserver.observe(container);

    return () => {
      detachPlotDrag();
      resizeObserver.disconnect();
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
          onClick={() => resetXZoom(plotRef.current, data[0])}
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
    title: input.title,
    cursor: {
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
      { label: input.xLabel, stroke: "#334155", grid: { stroke: "#e2e8f0", width: 1 } },
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
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(x0, top, width, height);
    ctx.setLineDash([]);
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

function attachPlotDrag(
  plot: uPlot,
  input: {
    onSelectRange?: (range: FitRange) => void;
    onAfterScale: () => void;
  },
): () => void {
  const over = plot.over;
  let start: { left: number; shiftKey: boolean } | undefined;
  let isDragging = false;

  const handleMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    start = { left: eventLeftInPlot(plot, event), shiftKey: event.shiftKey };
    isDragging = false;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp, { once: true });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!start) {
      return;
    }
    const current = eventLeftInPlot(plot, event);
    const width = Math.abs(current - start.left);
    if (width < 3) {
      return;
    }
    isDragging = true;
    event.preventDefault();
    plot.setSelect({
      left: Math.min(start.left, current),
      top: 0,
      width,
      height: plot.bbox.height / devicePixelRatio,
    });
  };

  const handleMouseUp = (event: MouseEvent) => {
    document.removeEventListener("mousemove", handleMouseMove);
    const dragStart = start;
    start = undefined;
    if (!dragStart || !isDragging) {
      plot.setSelect({ left: 0, top: 0, width: 0, height: 0 });
      return;
    }
    const end = eventLeftInPlot(plot, event);
    const from = plot.posToVal(Math.min(dragStart.left, end), "x");
    const to = plot.posToVal(Math.max(dragStart.left, end), "x");
    const range = normalizeRange({ min: from, max: to });
    plot.setSelect({ left: 0, top: 0, width: 0, height: 0 });
    if (dragStart.shiftKey && input.onSelectRange) {
      input.onSelectRange(range);
      input.onAfterScale();
      return;
    }
    plot.setScale("x", range);
    input.onAfterScale();
  };

  over.addEventListener("mousedown", handleMouseDown);
  return () => {
    over.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };
}

function eventLeftInPlot(plot: uPlot, event: MouseEvent): number {
  const rect = plot.over.getBoundingClientRect();
  const left = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  return left;
}

function resetXZoom(plot: uPlot | undefined, xValues: readonly number[]): void {
  const min = xValues[0];
  const max = xValues[xValues.length - 1];
  if (!plot || min === undefined || max === undefined) {
    return;
  }
  plot.setScale("x", { min, max });
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
