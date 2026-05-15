import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FitRange } from "../../domain/types";
import { ContextMenu, type ContextMenuItem, useContextMenu } from "../ContextMenu";
import type { PlotAnnotation, PlotMarker, PlotRangeBand, PlotSeries } from "../plotData";
import {
  clampPlotPosition,
  createPlotScales,
  DEFAULT_SIZE,
  nextViewportAfterDrag,
  nextViewportAfterWheel,
  normalizeRange,
  plotXToValue,
  selectionRectForMode,
  sizeFor,
  startPlotDrag,
  startPlotPan,
  type DragState,
  type PlotScales,
  type PlotViewport,
} from "./SpectrumPlotModel";
import { NoDataPlot, SelectionOverlay } from "./SpectrumPlotChrome";
import {
  CursorHandles,
  CursorPointMarkers,
  MarkerLine,
  PlotAnnotations,
  PlotAxes,
  RangeBand,
  SeriesPath,
} from "./SpectrumPlotParts";
import { exportPng, exportSvg } from "./plotExport";

export type { PlotGeometry, PlotScaleRange, PlotScales, PlotViewport } from "./SpectrumPlotModel";

export {
  createPlotGeometry,
  createPlotScales,
  formatTickParts,
  inferPlotDragZoomMode,
  nextViewportAfterWheel,
  plotXToValue,
  plotYToValue,
  rangeAfterCursorDrag,
  selectionRectForMode,
  shouldRenderSeriesInXDomain,
  shiftRangeByDelta,
  zoomRangeAt,
} from "./SpectrumPlotModel";
export { fitLabelPointForSeries } from "./SpectrumPlotParts";

const EMPTY_MARKERS: PlotMarker[] = [];
const EMPTY_RANGE_BANDS: PlotRangeBand[] = [];

interface SpectrumPlotProps {
  title: string;
  xLabel: string;
  yLabel: string;
  yRightLabel?: string;
  hideYTicks?: boolean;
  largeAxisLabels?: boolean;
  marginVariant?: "normal" | "leips";
  series: PlotSeries[];
  markers?: PlotMarker[];
  rangeBands?: PlotRangeBand[];
  annotations?: PlotAnnotation[];
  xDirection?: "normal" | "reverse";
  viewportRequest?: { id: number; viewport: PlotViewport };
  extraContextMenuItems?: ContextMenuItem[];
  onSelectRange?: (range: FitRange) => void;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
  onViewportChange?: (viewport: PlotViewport) => void;
}

export function SpectrumPlot({
  title,
  xLabel,
  yLabel,
  yRightLabel,
  hideYTicks = false,
  largeAxisLabels = false,
  marginVariant = "normal",
  series,
  markers = EMPTY_MARKERS,
  rangeBands = EMPTY_RANGE_BANDS,
  annotations = [],
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
  const [showCursorRanges, setShowCursorRanges] = useState(true);
  const [cursorMode, setCursorMode] = useState<"range" | "point">("range");
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
              type: "item",
              label: cursorMode === "range" ? "Use point cursors" : "Use range cursors",
              action: () => setCursorMode((current) => (current === "range" ? "point" : "range")),
            },
          ] as ContextMenuItem[])
        : []),
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
            marginVariant,
            viewport,
          })
        : undefined,
    [hasData, largeAxisLabels, marginVariant, series, size, viewport, xDirection],
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
      <NoDataPlot
        containerRef={containerRef}
        menu={menu}
        onCloseMenu={closeMenu}
        onOpenMenu={openPlotContextMenu}
        title={title}
        xDirection={xDirection}
      />
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
          <marker
            id="plot-arrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
            viewBox="0 0 8 8"
          >
            <path d="M 0 1 L 7 4 L 0 7 z" fill="black" />
          </marker>
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
          {showCursorRanges && cursorMode === "range"
            ? rangeBands.map((band) => (
                <RangeBand
                  key={band.id ?? `${band.label}-${band.min}-${band.max}`}
                  band={band}
                  geometry={geometry}
                  onRangeBandChange={onRangeBandChange}
                  xScale={xScale}
                />
              ))
            : null}
          {series.map((item) => (
            <SeriesPath
              key={item.name}
              clipId={clipId}
              geometry={geometry}
              visibleXDomain={scales.xDomain}
              series={item}
              showFitLabel={!showCursorRanges}
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
        {showCursorRanges && cursorMode === "range"
          ? rangeBands.map((band) => (
              <CursorHandles
                key={band.id ?? `${band.label}-${band.min}-${band.max}`}
                band={band}
                geometry={geometry}
                xScale={xScale}
                onRangeBandChange={onRangeBandChange}
              />
            ))
          : null}
        {showCursorRanges && cursorMode === "point" ? (
          <CursorPointMarkers
            geometry={geometry}
            onRangeBandChange={onRangeBandChange}
            rangeBands={rangeBands}
            series={series}
            xScale={xScale}
            yRightScale={yRightScale}
            yScale={yScale}
          />
        ) : null}
        <PlotAnnotations annotations={annotations} geometry={geometry} xScale={xScale} />
        <SelectionOverlay drag={drag} geometry={geometry} selection={selection} />
      </svg>
      <ContextMenu menu={menu} onClose={closeMenu} />
    </div>
  );
}
