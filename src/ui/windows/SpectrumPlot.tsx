import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FitRange } from "../../domain/types";
import { ContextMenu, type ContextMenuItem } from "../ContextMenu";
import type { CursorStyle } from "../Settings";
import type { PlotAnnotation, PlotMarker, PlotRangeBand, PlotSeries } from "../plotData";
import {
  createPlotScales,
  DEFAULT_SIZE,
  nextViewportAfterWheel,
  sizeFor,
  type DragState,
  type PlotScales,
  type PlotViewport,
} from "./SpectrumPlotModel";
import { NoDataPlot } from "./SpectrumPlotChrome";
import { useSpectrumPlotContextMenu } from "./SpectrumPlotContextMenu";
import { SpectrumPlotSvg } from "./SpectrumPlotSvg";
import { useSpectrumPlotViewport } from "./SpectrumPlotViewportState";

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
  marginVariant?: "normal" | "leips" | "bias";
  xLabelBottomPadding?: number;
  series: PlotSeries[];
  markers?: PlotMarker[];
  rangeBands?: PlotRangeBand[];
  annotations?: PlotAnnotation[];
  xDirection?: "normal" | "reverse";
  viewportRequest?: { id: number | string; viewport: PlotViewport };
  extraContextMenuItems?: ContextMenuItem[];
  cursorStyle?: CursorStyle;
  onCursorStyleChange?: (style: CursorStyle) => void;
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
  xLabelBottomPadding,
  series,
  markers = EMPTY_MARKERS,
  rangeBands = EMPTY_RANGE_BANDS,
  annotations = [],
  xDirection = "normal",
  viewportRequest,
  extraContextMenuItems = [],
  cursorStyle = "point",
  onCursorStyleChange,
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
  const [drag, setDrag] = useState<DragState | undefined>();
  const [showCursorRanges, setShowCursorRanges] = useState(true);
  const hasData = series.some((item) => item.points.length > 0);
  const { resetViewport, updateViewport, viewport } = useSpectrumPlotViewport({
    onViewportChange,
    viewportRequest,
  });
  const { closeMenu, menu, openPlotContextMenu } = useSpectrumPlotContextMenu({
    cursorStyle,
    extraContextMenuItems,
    hasData,
    onCursorStyleChange,
    resetViewport,
    setShowCursorRanges,
    showCursorRanges,
    svgRef,
    title,
  });

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
      <SpectrumPlotSvg
        annotations={annotations}
        clipId={clipId}
        cursorStyle={cursorStyle}
        drag={drag}
        hideYTicks={hideYTicks}
        largeAxisLabels={largeAxisLabels}
        markers={markers}
        onRangeBandChange={onRangeBandChange}
        onSelectRange={onSelectRange}
        openPlotContextMenu={openPlotContextMenu}
        rangeBands={rangeBands}
        resetViewport={resetViewport}
        scales={scales}
        series={series}
        setDrag={setDrag}
        showCursorRanges={showCursorRanges}
        size={size}
        svgRef={svgRef}
        updateViewport={updateViewport}
        xLabel={xLabel}
        xLabelBottomPadding={xLabelBottomPadding}
        yLabel={yLabel}
        yRightLabel={yRightLabel}
      />
      <ContextMenu menu={menu} onClose={closeMenu} />
    </div>
  );
}
