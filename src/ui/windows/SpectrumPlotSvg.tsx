import type { Dispatch, RefObject, SetStateAction } from "react";
import type { FitRange } from "../../domain/types";
import type { CursorStyle } from "../Settings";
import type { PlotAnnotation, PlotMarker, PlotRangeBand, PlotSeries } from "../plotData";
import {
  clampPlotPosition,
  nextViewportAfterDrag,
  normalizeRange,
  plotXToValue,
  selectionRectForMode,
  startPlotDrag,
  startPlotPan,
  type DragState,
  type PlotScales,
  type PlotViewport,
} from "./SpectrumPlotModel";
import { SelectionOverlay } from "./SpectrumPlotChrome";
import {
  CursorHandles,
  CursorPointMarkers,
  CursorSinglePointMarkers,
  HorizontalSinglePointLines,
  MarkerLine,
  PlotAnnotations,
  PlotAxes,
  RangeBand,
  SeriesPath,
} from "./SpectrumPlotParts";

export function SpectrumPlotSvg({
  annotations,
  clipId,
  cursorStyle,
  drag,
  hideYTicks,
  largeAxisLabels,
  markers,
  onRangeBandChange,
  onSelectRange,
  openPlotContextMenu,
  rangeBands,
  resetViewport,
  scales,
  series,
  setDrag,
  showCursorRanges,
  size,
  svgRef,
  updateViewport,
  xLabel,
  xLabelBottomPadding,
  yLabel,
  yRightLabel,
}: {
  annotations: readonly PlotAnnotation[];
  clipId: string;
  cursorStyle: CursorStyle;
  drag: DragState | undefined;
  hideYTicks: boolean;
  largeAxisLabels: boolean;
  markers: readonly PlotMarker[];
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
  onSelectRange?: (range: FitRange) => void;
  openPlotContextMenu: (x: number, y: number) => void;
  rangeBands: readonly PlotRangeBand[];
  resetViewport: () => void;
  scales: PlotScales;
  series: readonly PlotSeries[];
  setDrag: Dispatch<SetStateAction<DragState | undefined>>;
  showCursorRanges: boolean;
  size: { width: number; height: number };
  svgRef: RefObject<SVGSVGElement | null>;
  updateViewport: (next: PlotViewport | ((current: PlotViewport) => PlotViewport)) => void;
  xLabel: string;
  xLabelBottomPadding?: number;
  yLabel: string;
  yRightLabel?: string;
}) {
  const { geometry, xScale, yScale, yRightScale } = scales;
  const singlePointBands = rangeBands.filter((band) => band.singlePointMode === "horizontal");
  const standardBands = rangeBands.filter((band) => band.singlePointMode !== "horizontal");
  const selection = drag
    ? selectionRectForMode(drag.start, clampPlotPosition(drag.current, geometry), {
        width: geometry.plotWidth,
        height: geometry.plotHeight,
      })
    : undefined;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 h-full w-full touch-none select-none"
      height={size.height}
      role="img"
      viewBox={`0 0 ${size.width} ${size.height}`}
      width={size.width}
      onDoubleClick={(event) => {
        event.preventDefault();
        resetViewport();
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
        xLabelBottomPadding={xLabelBottomPadding}
        yLabel={yLabel}
        yRightLabel={yRightLabel}
      />
      <g clipPath={`url(#${clipId})`}>
        {showCursorRanges && cursorStyle === "range"
          ? standardBands.map((band) => (
              <RangeBand
                key={band.id ?? `${band.label}-${band.min}-${band.max}`}
                band={band}
                geometry={geometry}
                onRangeBandChange={onRangeBandChange}
                xScale={xScale}
              />
            ))
          : null}
        {showCursorRanges && singlePointBands.length > 0 ? (
          <HorizontalSinglePointLines
            geometry={geometry}
            rangeBands={singlePointBands}
            series={series}
            yRightScale={yRightScale}
            yScale={yScale}
          />
        ) : null}
        {series.map((item) => (
          <SeriesPath
            key={item.name}
            clipId={clipId}
            geometry={geometry}
            visibleXDomain={scales.xDomain}
            series={item}
            showFitLabel={!showCursorRanges || rangeBands.length === 0}
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
      {showCursorRanges && cursorStyle === "range"
        ? standardBands.map((band) => (
            <CursorHandles
              key={band.id ?? `${band.label}-${band.min}-${band.max}`}
              band={band}
              geometry={geometry}
              xScale={xScale}
              onRangeBandChange={onRangeBandChange}
            />
          ))
        : null}
      {showCursorRanges && cursorStyle === "point" ? (
        <CursorPointMarkers
          geometry={geometry}
          onRangeBandChange={onRangeBandChange}
          rangeBands={standardBands}
          series={series}
          xScale={xScale}
          yRightScale={yRightScale}
          yScale={yScale}
        />
      ) : null}
      {showCursorRanges && singlePointBands.length > 0 ? (
        <CursorSinglePointMarkers
          geometry={geometry}
          onRangeBandChange={onRangeBandChange}
          rangeBands={singlePointBands}
          series={series}
          xScale={xScale}
          yRightScale={yRightScale}
          yScale={yScale}
        />
      ) : null}
      <PlotAnnotations annotations={annotations} geometry={geometry} xScale={xScale} />
      <SelectionOverlay drag={drag} geometry={geometry} selection={selection} />
    </svg>
  );
}
