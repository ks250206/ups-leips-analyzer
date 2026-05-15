import { extent } from "d3-array";
import { scaleLinear, type ScaleLinear } from "d3-scale";
import { line } from "d3-shape";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { FitRange, Point } from "../../domain/types";
import { ContextMenu, type ContextMenuItem, useContextMenu } from "../ContextMenu";
import type { PlotMarker, PlotRangeBand, PlotSeries } from "../plotData";

interface SpectrumPlotProps {
  title: string;
  xLabel: string;
  yLabel: string;
  yRightLabel?: string;
  hideYTicks?: boolean;
  largeAxisLabels?: boolean;
  series: PlotSeries[];
  markers?: PlotMarker[];
  rangeBands?: PlotRangeBand[];
  xDirection?: "normal" | "reverse";
  viewportRequest?: { id: number; viewport: PlotViewport };
  extraContextMenuItems?: ContextMenuItem[];
  onSelectRange?: (range: FitRange) => void;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
  onViewportChange?: (viewport: PlotViewport) => void;
}

export interface SpectrumPlotScaleInput {
  size: { width: number; height: number };
  series: readonly PlotSeries[];
  xDirection: "normal" | "reverse";
  largeAxisLabels?: boolean;
  viewport?: PlotViewport;
}

export interface PlotGeometry {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  plotWidth: number;
  plotHeight: number;
  plotRight: number;
  plotBottom: number;
}

export interface PlotScaleRange {
  min: number;
  max: number;
}

export interface PlotViewport {
  x?: PlotScaleRange;
  y?: PlotScaleRange;
  y2?: PlotScaleRange;
}

export interface PlotScales {
  geometry: PlotGeometry;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  yRightScale?: ScaleLinear<number, number>;
  xDomain: PlotScaleRange;
  yDomain: PlotScaleRange;
  yRightDomain?: PlotScaleRange;
}

interface DragState {
  start: { left: number; top: number };
  current: { left: number; top: number };
  shiftKey: boolean;
}

const EMPTY_MARKERS: PlotMarker[] = [];
const EMPTY_RANGE_BANDS: PlotRangeBand[] = [];
const DEFAULT_SIZE = { width: 640, height: 360 };
const MIN_PLOT_SIZE = { width: 260, height: 190 };

export function SpectrumPlot({
  title,
  xLabel,
  yLabel,
  yRightLabel,
  hideYTicks = false,
  largeAxisLabels = false,
  series,
  markers = EMPTY_MARKERS,
  rangeBands = EMPTY_RANGE_BANDS,
  xDirection = "normal",
  viewportRequest,
  extraContextMenuItems = [],
  onSelectRange,
  onRangeBandChange,
  onViewportChange,
}: SpectrumPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scalesRef = useRef<PlotScales | undefined>(undefined);
  const xDirectionRef = useRef<"normal" | "reverse">(xDirection);
  const clipId = useId();
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [viewport, setViewport] = useState<PlotViewport>({});
  const [drag, setDrag] = useState<DragState | undefined>();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const hasData = series.some((item) => item.points.length > 0);

  const updateViewport = (next: PlotViewport | ((current: PlotViewport) => PlotViewport)) => {
    setViewport((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      onViewportChange?.(resolved);
      return resolved;
    });
  };
  const openPlotContextMenu = (x: number, y: number) =>
    openMenu(x, y, [
      { type: "item", label: "Reset view", action: () => updateViewport({}) },
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
      ...(extraContextMenuItems.length > 0
        ? ([{ type: "separator" }, ...extraContextMenuItems] as ContextMenuItem[])
        : []),
    ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    const updateSize = () => {
      const nextSize = sizeFor(container);
      setSize((current) =>
        current.width === nextSize.width && current.height === nextSize.height ? current : nextSize,
      );
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasData]);

  useEffect(() => {
    if (!viewportRequest) {
      return;
    }
    updateViewport(viewportRequest.viewport);
  }, [viewportRequest?.id]);

  const scales = useMemo(
    () =>
      hasData
        ? createPlotScales({
            size,
            series,
            xDirection,
            largeAxisLabels,
            viewport,
          })
        : undefined,
    [hasData, largeAxisLabels, series, size, viewport, xDirection],
  );
  scalesRef.current = scales;
  xDirectionRef.current = xDirection;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return undefined;
    }
    const handleWheel = (event: WheelEvent) => {
      const currentScales = scalesRef.current;
      if (!currentScales) {
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      updateViewport((current) =>
        nextViewportAfterWheel(current, currentScales, event, xDirectionRef.current, svg),
      );
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [hasData]);

  if (!hasData || !scales) {
    return (
      <div
        ref={containerRef}
        aria-label={`${title} plot`}
        className="relative flex h-full w-full items-center justify-center bg-white text-sm text-slate-500"
        data-plot-host="true"
        data-x-direction={xDirection}
        onContextMenu={(event) => {
          event.preventDefault();
          openPlotContextMenu(event.clientX, event.clientY);
        }}
        onPointerDown={(event) => {
          if (event.button === 2) {
            event.preventDefault();
            openPlotContextMenu(event.clientX, event.clientY);
          }
        }}
      >
        <div className="rounded border border-slate-300 bg-slate-50 px-4 py-3 text-center">
          <div className="font-semibold text-slate-700">No data</div>
          <div className="mt-1 text-xs">Load CSV or Demo data to render this plot.</div>
        </div>
        <ContextMenu menu={menu} onClose={closeMenu} />
      </div>
    );
  }

  const { geometry, xScale, yScale, yRightScale } = scales;
  const selection = drag
    ? selectionRectForMode(drag.start, clampPlotPosition(drag.current, geometry), {
        width: geometry.plotWidth,
        height: geometry.plotHeight,
      })
    : undefined;

  return (
    <div
      ref={containerRef}
      aria-label={`${title} plot`}
      className="relative h-full w-full overflow-hidden bg-white"
      data-plot-host="true"
      data-x-direction={xDirection}
      data-large-axis-labels={largeAxisLabels ? "true" : "false"}
      style={{ contain: "layout paint size" }}
      onContextMenu={(event) => {
        event.preventDefault();
        openPlotContextMenu(event.clientX, event.clientY);
      }}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full touch-none select-none"
        height={size.height}
        role="img"
        viewBox={`0 0 ${size.width} ${size.height}`}
        width={size.width}
        onDoubleClick={(event) => {
          event.preventDefault();
          setViewport({});
        }}
        onPointerDown={(event) => {
          if (event.button === 2) {
            event.preventDefault();
            event.stopPropagation();
            openPlotContextMenu(event.clientX, event.clientY);
            return;
          }
          if (event.altKey) {
            startPlotPan(event, geometry, scales, updateViewport);
            return;
          }
          startPlotDrag(event, geometry, setDrag, (start, end, shiftKey) => {
            if (shiftKey && onSelectRange) {
              onSelectRange(
                normalizeRange({
                  min: plotXToValue(scales, start.left),
                  max: plotXToValue(scales, end.left),
                }),
              );
              return;
            }
            updateViewport((current) => nextViewportAfterDrag(current, scales, start, end));
          });
        }}
      >
        <rect fill="#ffffff" height={size.height} width={size.width} x={0} y={0} />
        <defs>
          <clipPath id={clipId}>
            <rect
              height={geometry.plotHeight}
              width={geometry.plotWidth}
              x={geometry.left}
              y={geometry.top}
            />
          </clipPath>
        </defs>
        <PlotAxes
          geometry={geometry}
          hideYTicks={hideYTicks}
          largeAxisLabels={largeAxisLabels}
          scales={scales}
          xLabel={xLabel}
          yLabel={yLabel}
          yRightLabel={yRightLabel}
        />
        <g clipPath={`url(#${clipId})`}>
          {rangeBands.map((band) => (
            <RangeBand
              key={band.id ?? `${band.label}-${band.min}-${band.max}`}
              band={band}
              geometry={geometry}
              onRangeBandChange={onRangeBandChange}
              xScale={xScale}
            />
          ))}
          {series.map((item) => (
            <SeriesPath
              key={item.name}
              clipId={clipId}
              geometry={geometry}
              visibleXDomain={scales.xDomain}
              series={item}
              xScale={xScale}
              yScale={item.yAxis === "right" && yRightScale ? yRightScale : yScale}
            />
          ))}
          {markers.map((marker) => (
            <MarkerLine
              key={`${marker.label}-${marker.x}`}
              geometry={geometry}
              marker={marker}
              xScale={xScale}
            />
          ))}
        </g>
        {rangeBands.map((band) => (
          <CursorHandles
            key={band.id ?? `${band.label}-${band.min}-${band.max}`}
            band={band}
            geometry={geometry}
            xScale={xScale}
            onRangeBandChange={onRangeBandChange}
          />
        ))}
        {selection ? (
          <rect
            fill={drag?.shiftKey ? "rgba(14, 165, 233, 0.08)" : "rgba(15, 23, 42, 0.07)"}
            height={selection.height}
            pointerEvents="none"
            stroke={drag?.shiftKey ? "#0284c7" : "#475569"}
            width={selection.width}
            x={geometry.left + selection.left}
            y={geometry.top + selection.top}
          />
        ) : null}
      </svg>
      <ContextMenu menu={menu} onClose={closeMenu} />
    </div>
  );
}

function PlotAxes({
  geometry,
  hideYTicks,
  largeAxisLabels,
  scales,
  xLabel,
  yLabel,
  yRightLabel,
}: {
  geometry: PlotGeometry;
  hideYTicks: boolean;
  largeAxisLabels: boolean;
  scales: PlotScales;
  xLabel: string;
  yLabel: string;
  yRightLabel?: string;
}) {
  const xTicks = scales.xScale.ticks(7);
  const yTicks = scales.yScale.ticks(5);
  const yRightTicks = scales.yRightScale?.ticks(5) ?? [];
  const axisColor = "#334155";
  const labelSize = largeAxisLabels ? 24 : 13;
  const labelWeight = largeAxisLabels ? 800 : 700;
  return (
    <g>
      {xTicks.map((tick) => {
        const x = scales.xScale(tick);
        return (
          <g key={`x-${tick}`}>
            <line
              stroke={axisColor}
              x1={x}
              x2={x}
              y1={geometry.plotBottom - 6}
              y2={geometry.plotBottom}
            />
            <text
              fill={axisColor}
              fontSize={12}
              textAnchor="middle"
              x={x}
              y={geometry.plotBottom + 20}
            >
              <TickLabel value={tick} />
            </text>
          </g>
        );
      })}
      {!hideYTicks
        ? yTicks.map((tick) => {
            const y = scales.yScale(tick);
            return (
              <g key={`y-${tick}`}>
                <line stroke={axisColor} x1={geometry.left} x2={geometry.left + 6} y1={y} y2={y} />
                <text
                  fill={axisColor}
                  fontSize={12}
                  textAnchor="end"
                  x={geometry.left - 12}
                  y={y + 4}
                >
                  <TickLabel value={tick} />
                </text>
              </g>
            );
          })
        : null}
      {!hideYTicks && scales.yRightScale
        ? yRightTicks.map((tick) => {
            const y = scales.yRightScale?.(tick) ?? 0;
            return (
              <g key={`y2-${tick}`}>
                <line
                  stroke="#dc2626"
                  x1={geometry.plotRight - 6}
                  x2={geometry.plotRight}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#dc2626"
                  fontSize={12}
                  textAnchor="start"
                  x={geometry.plotRight + 12}
                  y={y + 4}
                >
                  <TickLabel value={tick} />
                </text>
              </g>
            );
          })
        : null}
      <rect
        fill="none"
        height={geometry.plotHeight}
        stroke={axisColor}
        strokeWidth={1}
        width={geometry.plotWidth}
        x={geometry.left}
        y={geometry.top}
      />
      <text
        fill={axisColor}
        fontSize={largeAxisLabels ? 22 : 12}
        fontWeight={labelWeight}
        textAnchor="middle"
        x={geometry.left + geometry.plotWidth / 2}
        y={geometry.height - (largeAxisLabels ? 16 : 10)}
      >
        {xLabel}
      </text>
      <text
        fill={axisColor}
        fontSize={labelSize}
        fontWeight={labelWeight}
        textAnchor="middle"
        transform={`rotate(-90 ${largeAxisLabels ? 28 : 22} ${geometry.top + geometry.plotHeight / 2})`}
        x={largeAxisLabels ? 28 : 22}
        y={geometry.top + geometry.plotHeight / 2}
      >
        {yLabel}
      </text>
      {yRightLabel ? (
        <text
          fill="#dc2626"
          fontSize={labelSize}
          fontWeight={labelWeight}
          textAnchor="middle"
          transform={`rotate(90 ${geometry.width - (largeAxisLabels ? 28 : 22)} ${geometry.top + geometry.plotHeight / 2})`}
          x={geometry.width - (largeAxisLabels ? 28 : 22)}
          y={geometry.top + geometry.plotHeight / 2}
        >
          {yRightLabel}
        </text>
      ) : null}
    </g>
  );
}

function SeriesPath({
  series,
  xScale,
  yScale,
  visibleXDomain,
}: {
  clipId: string;
  geometry: PlotGeometry;
  visibleXDomain: PlotScaleRange;
  series: PlotSeries;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
}) {
  if (!shouldRenderSeriesInXDomain(series, visibleXDomain)) {
    return null;
  }
  const path = line<Point>()
    .defined((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .x((point) => xScale(point.x))
    .y((point) => yScale(point.y))(sortedPoints(series.points));
  if (!path) {
    return null;
  }
  return (
    <path
      d={path}
      fill="none"
      stroke={series.color}
      strokeDasharray={series.dash?.join(" ")}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={series.width ?? 2}
    />
  );
}

function RangeBand({
  band,
  geometry,
  onRangeBandChange,
  xScale,
}: {
  band: PlotRangeBand;
  geometry: PlotGeometry;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
  xScale: ScaleLinear<number, number>;
}) {
  const x0 = xScale(Math.min(band.min, band.max));
  const x1 = xScale(Math.max(band.min, band.max));
  const left = Math.min(x0, x1);
  const width = Math.abs(x1 - x0);
  return (
    <g>
      <rect
        className={band.id && onRangeBandChange ? "cursor-grab active:cursor-grabbing" : undefined}
        fill={withAlpha(band.color, 0.055)}
        height={geometry.plotHeight}
        width={width}
        x={left}
        y={geometry.top}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          startRangeBandDrag(event, geometry, xScale, band, onRangeBandChange);
        }}
      />
      <text fill={band.color} fontSize={11} x={left + 4} y={geometry.plotBottom - 8}>
        {band.label}
      </text>
    </g>
  );
}

function MarkerLine({
  geometry,
  marker,
  xScale,
}: {
  geometry: PlotGeometry;
  marker: PlotMarker;
  xScale: ScaleLinear<number, number>;
}) {
  const x = xScale(marker.x);
  return (
    <g>
      <line
        stroke={marker.color}
        strokeDasharray="5 4"
        x1={x}
        x2={x}
        y1={geometry.top}
        y2={geometry.plotBottom}
      />
      <text fill={marker.color} fontSize={12} x={x + 4} y={geometry.top + 16}>
        {marker.label}
      </text>
    </g>
  );
}

function TickLabel({ value }: { value: number }) {
  const formatted = formatTickParts(value);
  if (!formatted.exponent) {
    return <>{formatted.mantissa}</>;
  }
  return (
    <>
      {formatted.mantissa}
      <tspan>×10</tspan>
      <tspan baselineShift="super" fontSize="8">
        {formatted.exponent}
      </tspan>
    </>
  );
}

function CursorHandles({
  band,
  geometry,
  xScale,
  onRangeBandChange,
}: {
  band: PlotRangeBand;
  geometry: PlotGeometry;
  xScale: ScaleLinear<number, number>;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
}) {
  if (!band.id) {
    return null;
  }
  return (
    <g>
      {[
        { value: band.min, side: "min" as const },
        { value: band.max, side: "max" as const },
      ].map((handle) => {
        const x = xScale(handle.value);
        return (
          <g key={`${band.id}-${handle.side}`}>
            <line
              stroke={band.color}
              strokeWidth={1.5}
              x1={x}
              x2={x}
              y1={geometry.top}
              y2={geometry.plotBottom}
            />
            <rect
              aria-label={`${band.label} ${handle.side} cursor`}
              className="cursor-ew-resize"
              fill="transparent"
              height={geometry.plotHeight}
              role="button"
              width={14}
              x={x - 7}
              y={geometry.top}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                startHandleDrag(event, geometry, xScale, band, handle.side, onRangeBandChange);
              }}
            />
          </g>
        );
      })}
    </g>
  );
}

export function createPlotGeometry(
  size: { width: number; height: number },
  largeAxisLabels = false,
  hasRightAxis = false,
): PlotGeometry {
  const width = Math.max(MIN_PLOT_SIZE.width, Math.floor(size.width));
  const height = Math.max(MIN_PLOT_SIZE.height, Math.floor(size.height));
  const top = largeAxisLabels ? 44 : 32;
  const right = largeAxisLabels ? 78 : hasRightAxis ? 50 : 30;
  const bottom = largeAxisLabels ? 62 : 44;
  const left = largeAxisLabels ? 96 : 92;
  const plotWidth = Math.max(40, width - left - right);
  const plotHeight = Math.max(40, height - top - bottom);
  return {
    width,
    height,
    top,
    right,
    bottom,
    left,
    plotWidth,
    plotHeight,
    plotRight: left + plotWidth,
    plotBottom: top + plotHeight,
  };
}

export function createPlotScales(input: SpectrumPlotScaleInput): PlotScales {
  const hasRightAxis = input.series.some((item) => item.yAxis === "right");
  const geometry = createPlotGeometry(input.size, input.largeAxisLabels ?? false, hasRightAxis);
  const xDomain = input.viewport?.x ?? domainForX(input.series);
  const yDomain =
    input.viewport?.y ?? domainForY(input.series.filter((item) => item.yAxis !== "right"));
  const rightSeries = input.series.filter((item) => item.yAxis === "right");
  const yRightDomain =
    input.viewport?.y2 ?? (rightSeries.length > 0 ? domainForY(rightSeries) : undefined);
  const xRange =
    input.xDirection === "reverse"
      ? [geometry.plotRight, geometry.left]
      : [geometry.left, geometry.plotRight];

  return {
    geometry,
    xScale: scaleLinear().domain([xDomain.min, xDomain.max]).range(xRange),
    yScale: scaleLinear()
      .domain([yDomain.min, yDomain.max])
      .range([geometry.plotBottom, geometry.top]),
    yRightScale: yRightDomain
      ? scaleLinear()
          .domain([yRightDomain.min, yRightDomain.max])
          .range([geometry.plotBottom, geometry.top])
      : undefined,
    xDomain,
    yDomain,
    yRightDomain,
  };
}

function sizeFor(element: HTMLElement): { width: number; height: number } {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(MIN_PLOT_SIZE.width, Math.floor(rect.width)),
    height: Math.max(MIN_PLOT_SIZE.height, Math.floor(rect.height)),
  };
}

function domainForX(series: readonly PlotSeries[]): PlotScaleRange {
  const scaleSeries = series.filter((item) => item.affectsScale ?? true);
  const points = (scaleSeries.length > 0 ? scaleSeries : series).flatMap((item) => item.points);
  return paddedDomain(extent(points, (point) => point.x));
}

function domainForY(series: readonly PlotSeries[]): PlotScaleRange {
  const scaleSeries = series.filter((item) => item.affectsScale ?? true);
  const points = (scaleSeries.length > 0 ? scaleSeries : series).flatMap((item) => item.points);
  return paddedDomain(extent(points, (point) => point.y));
}

function paddedDomain(valueExtent: [number | undefined, number | undefined]): PlotScaleRange {
  const min = Number(valueExtent[0]);
  const max = Number(valueExtent[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (Math.abs(max - min) < 1e-12) {
    const padding = Math.max(Math.abs(min) * 0.05, 1);
    return { min: min - padding, max: max + padding };
  }
  const padding = Math.max((max - min) * 0.05, 1e-9);
  return { min: min - padding, max: max + padding };
}

function sortedPoints(points: readonly Point[]): Point[] {
  return [...points].sort((left, right) => left.x - right.x);
}

function startPlotDrag(
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
    if (!moved) {
      return;
    }
    onComplete(start, current, shiftKey);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up, { once: true });
  window.addEventListener("pointercancel", cancel, { once: true });
}

function startPlotPan(
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

function startHandleDrag(
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
    const nextRange = rangeAfterCursorDrag(band, side, nextX);
    onRangeBandChange(band.id ?? "", nextRange);
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

function startRangeBandDrag(
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
    const delta = nextValue - startValue;
    onRangeBandChange(band.id ?? "", shiftRangeByDelta(initialRange, delta));
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

function eventPositionInPlot(
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

function isInsidePlot(position: { left: number; top: number }, geometry: PlotGeometry): boolean {
  return (
    position.left >= 0 &&
    position.left <= geometry.plotWidth &&
    position.top >= 0 &&
    position.top <= geometry.plotHeight
  );
}

function clampPlotPosition(
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

function nextViewportAfterDrag(
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

function nextViewportAfterPanDrag(
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

function currentViewportForScales(scales: PlotScales): PlotViewport {
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

function normalizeRange(range: FitRange): FitRange {
  return { min: Math.min(range.min, range.max), max: Math.max(range.min, range.max) };
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

export function formatTickParts(value: number): { mantissa: string; exponent?: number } {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const exponent = Math.floor(Math.log10(abs));
    const mantissa = value / 10 ** exponent;
    return {
      mantissa: mantissa.toPrecision(2),
      exponent,
    };
  }
  if (abs >= 100 || abs === 0) {
    return { mantissa: value.toFixed(0) };
  }
  if (abs >= 10) {
    return { mantissa: value.toFixed(1).replace(/\.0$/, "") };
  }
  return { mantissa: value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") };
}

function exportSvg(svg: SVGSVGElement | null, title: string): void {
  if (!svg) {
    return;
  }
  const source = new XMLSerializer().serializeToString(svg);
  download(
    `${safeName(title)}.svg`,
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`,
  );
}

function exportPng(svg: SVGSVGElement | null, title: string): void {
  if (!svg) {
    return;
  }
  const source = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = svg.viewBox.baseVal.width || svg.clientWidth;
    canvas.height = svg.viewBox.baseVal.height || svg.clientHeight;
    const context = canvas.getContext("2d");
    context?.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    download(`${safeName(title)}.png`, canvas.toDataURL("image/png"));
  };
  image.src = url;
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
