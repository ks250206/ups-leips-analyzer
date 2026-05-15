import type { ScaleLinear } from "d3-scale";
import { line } from "d3-shape";
import type { FitRange, Point } from "../../domain/types";
import type { PlotAnnotation, PlotMarker, PlotRangeBand, PlotSeries } from "../plotData";
import {
  formatTickParts,
  shouldRenderSeriesInXDomain,
  sortedPoints,
  startHandleDrag,
  startRangeBandDrag,
  withAlpha,
  type PlotGeometry,
  type PlotScaleRange,
  type PlotScales,
} from "./SpectrumPlotModel";

export function PlotAxes({
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
  const axisColor = "#000000";
  const labelSize = largeAxisLabels ? 24 : 15;
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
        fontSize={largeAxisLabels ? 22 : 14}
        fontWeight={labelWeight}
        textAnchor="middle"
        x={geometry.left + geometry.plotWidth / 2}
        y={geometry.height - (largeAxisLabels ? 8 : 4)}
      >
        <AxisLabelText label={xLabel} largeAxisLabels={largeAxisLabels} />
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

function AxisLabelText({ label, largeAxisLabels }: { label: string; largeAxisLabels: boolean }) {
  if (label === "Energy from Evac. / eV") {
    return (
      <>
        Energy from E
        <tspan baselineShift="sub" fontSize={largeAxisLabels ? 16 : 10}>
          vac.
        </tspan>{" "}
        / eV
      </>
    );
  }
  return label;
}

export function SeriesPath({
  series,
  xScale,
  yScale,
  showFitLabel = false,
  visibleXDomain,
}: {
  clipId: string;
  geometry: PlotGeometry;
  showFitLabel?: boolean;
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
  const labelPoint = midpointForLabel(series.points, xScale, yScale);
  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={series.color}
        strokeDasharray={series.dash?.join(" ")}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={series.width ?? 2}
      />
      {showFitLabel && series.fitLabel && labelPoint ? (
        <text
          fill={series.color}
          fontSize={11}
          fontWeight={700}
          paintOrder="stroke fill"
          stroke="white"
          strokeWidth={3}
          textAnchor="middle"
          x={labelPoint.x}
          y={labelPoint.y - 6}
        >
          {series.fitLabel}
        </text>
      ) : null}
    </g>
  );
}

function midpointForLabel(
  points: readonly Point[],
  xScale: ScaleLinear<number, number>,
  yScale: ScaleLinear<number, number>,
): { x: number; y: number } | undefined {
  if (points.length === 0) {
    return undefined;
  }
  const point = points[Math.floor(points.length / 2)];
  return point ? { x: xScale(point.x), y: yScale(point.y) } : undefined;
}

export function RangeBand({
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

export function MarkerLine({
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

export function CursorHandles({
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

export function PlotAnnotations({
  annotations,
  geometry,
  xScale,
}: {
  annotations: readonly PlotAnnotation[];
  geometry: PlotGeometry;
  xScale: ScaleLinear<number, number>;
}) {
  return (
    <g>
      {annotations.map((annotation, index) => {
        if (annotation.type === "text") {
          return (
            <text
              key={`text-${annotation.label}-${index}`}
              fill={annotation.color}
              fontSize={annotation.fontSize ?? 30}
              fontWeight={700}
              textAnchor={annotation.anchor ?? "middle"}
              x={geometry.left + geometry.plotWidth * annotation.xFraction}
              y={geometry.top + geometry.plotHeight * annotation.yFraction}
            >
              {annotation.label}
            </text>
          );
        }
        const x1 = xScale(annotation.x1);
        const x2 = xScale(annotation.x2);
        const y = geometry.top + geometry.plotHeight * annotation.yFraction;
        return (
          <g key={`arrow-${annotation.label}-${index}`}>
            <line
              markerEnd="url(#plot-arrow)"
              stroke={annotation.color}
              strokeWidth={annotation.strokeWidth ?? 1.8}
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
            />
            <text
              fill={annotation.color}
              fontSize={annotation.fontSize ?? 24}
              fontWeight={700}
              textAnchor="middle"
              x={(x1 + x2) / 2}
              y={y - 10}
            >
              {annotation.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
