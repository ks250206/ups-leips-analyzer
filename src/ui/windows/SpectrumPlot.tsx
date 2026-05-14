import { useEffect, useMemo, useRef } from "react";
import uPlot from "uplot";
import type { FitRange } from "../../domain/types";
import { alignSeries, type PlotMarker, type PlotSeries } from "../plotData";

interface SpectrumPlotProps {
  title: string;
  xLabel: string;
  yLabel: string;
  series: PlotSeries[];
  markers?: PlotMarker[];
  onSelectRange?: (range: FitRange) => void;
}

export function SpectrumPlot({
  title,
  xLabel,
  yLabel,
  series,
  markers = [],
  onSelectRange,
}: SpectrumPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | undefined>(undefined);
  const data = useMemo(() => alignSeries(series), [series]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || series.length === 0) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      const plot = plotRef.current;
      if (plot) {
        plot.setSize(sizeFor(container));
      }
    });

    const options: uPlot.Options = {
      ...sizeFor(container),
      title,
      cursor: {
        drag: {
          setScale: false,
          x: true,
          y: false,
        },
      },
      legend: { show: true },
      scales: { x: { time: false } },
      axes: [
        { label: xLabel, stroke: "#334155", grid: { stroke: "#e2e8f0", width: 1 } },
        { label: yLabel, stroke: "#334155", grid: { stroke: "#edf2f7", width: 1 } },
      ],
      series: [
        {},
        ...series.map((item) => ({
          label: item.name,
          stroke: item.color,
          width: item.width ?? 2,
          dash: item.dash,
        })),
      ],
      hooks: {
        setSelect: [
          (plot) => {
            if (!onSelectRange || plot.select.width <= 0) {
              return;
            }
            const start = plot.posToVal(plot.select.left, "x");
            const end = plot.posToVal(plot.select.left + plot.select.width, "x");
            onSelectRange({ min: Math.min(start, end), max: Math.max(start, end) });
          },
        ],
        draw: [
          (plot) => {
            drawMarkers(plot, markers);
          },
        ],
      },
    };

    plotRef.current?.destroy();
    plotRef.current = new uPlot(options, data as uPlot.AlignedData, container);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      plotRef.current?.destroy();
      plotRef.current = undefined;
    };
  }, [data, markers, onSelectRange, series, title, xLabel, yLabel]);

  return (
    <div className="relative h-full w-full bg-white">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute right-2 top-2 flex gap-1">
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

function exportPng(plot: uPlot | undefined, title: string): void {
  const canvas = plot?.ctx.canvas;
  if (!canvas) {
    return;
  }
  download(`${safeName(title)}.png`, canvas.toDataURL("image/png"));
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
