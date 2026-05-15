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
  geometry,
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
  const labelPoint = fitLabelPointForSeries(series, visibleXDomain, geometry, xScale, yScale);
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
          y={labelPoint.y}
        >
          {series.fitLabel}
        </text>
      ) : null}
    </g>
  );
}

export function fitLabelPointForSeries(
  series: PlotSeries,
  visibleXDomain: PlotScaleRange,
  geometry: PlotGeometry,
  xScale: ScaleLinear<number, number>,
  yScale: ScaleLinear<number, number>,
): { x: number; y: number } | undefined {
  const points = sortedPoints(series.points);
  if (points.length === 0) {
    return undefined;
  }
  const min = Math.max(points[0]?.x ?? visibleXDomain.min, visibleXDomain.min);
  const max = Math.min(points[points.length - 1]?.x ?? visibleXDomain.max, visibleXDomain.max);
  const targetX =
    min <= max ? fitLabelEdgeX(min, max, xScale) : points[Math.floor(points.length / 2)]?.x;
  if (targetX === undefined) {
    return undefined;
  }
  const targetY = interpolateY(points, targetX);
  const textHalfWidth = Math.max(24, (series.fitLabel?.length ?? 0) * 3.6);
  return {
    x: clamp(xScale(targetX), geometry.left + textHalfWidth, geometry.plotRight - textHalfWidth),
    y: clamp(yScale(targetY) - 6, geometry.top + 14, geometry.plotBottom - 8),
  };
}

function fitLabelEdgeX(min: number, max: number, xScale: ScaleLinear<number, number>): number {
  return xScale(min) <= xScale(max) ? min : max;
}

function interpolateY(points: readonly Point[], x: number): number {
  if (points.length === 1) {
    return points[0]?.y ?? 0;
  }
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    if (!previous || !next) {
      continue;
    }
    const min = Math.min(previous.x, next.x);
    const max = Math.max(previous.x, next.x);
    if (x >= min && x <= max) {
      const span = next.x - previous.x;
      if (span === 0) {
        return next.y;
      }
      const ratio = (x - previous.x) / span;
      return previous.y + (next.y - previous.y) * ratio;
    }
  }
  return points[Math.floor(points.length / 2)]?.y ?? 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

export function CursorPointMarkers({
  geometry,
  onRangeBandChange,
  rangeBands,
  series,
  xScale,
  yScale,
  yRightScale,
}: {
  geometry: PlotGeometry;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
  rangeBands: readonly PlotRangeBand[];
  series: readonly PlotSeries[];
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  yRightScale?: ScaleLinear<number, number>;
}) {
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let labelIndex = 0;
  return (
    <g>
      {rangeBands.flatMap((band) =>
        [
          { value: band.min, side: "min" as const },
          { value: band.max, side: "max" as const },
        ].map((handle) => {
          const label = labels[labelIndex] ?? `${labelIndex + 1}`;
          labelIndex += 1;
          const targetSeries = seriesForCursorBand(series, band);
          const y = cursorYForValue(targetSeries, handle.value);
          const scale = targetSeries?.yAxis === "right" && yRightScale ? yRightScale : yScale;
          const xPosition = xScale(handle.value);
          const yPosition = Math.min(Math.max(scale(y), geometry.top), geometry.plotBottom);
          return (
            <g key={`${band.id ?? band.label}-${handle.side}-${label}`}>
              <line
                stroke={band.color}
                strokeWidth={1.2}
                x1={xPosition - 5}
                x2={xPosition + 5}
                y1={yPosition}
                y2={yPosition}
              />
              <line
                stroke={band.color}
                strokeWidth={1.2}
                x1={xPosition}
                x2={xPosition}
                y1={yPosition - 5}
                y2={yPosition + 5}
              />
              <rect
                aria-label={`${label} cursor`}
                className="cursor-ew-resize"
                fill={band.color}
                height={14}
                rx={3}
                width={14}
                x={xPosition - 7}
                y={Math.max(geometry.top + 2, yPosition - 21)}
              />
              <text
                fill="white"
                fontSize={10}
                fontWeight={800}
                pointerEvents="none"
                textAnchor="middle"
                x={xPosition}
                y={Math.max(geometry.top + 13, yPosition - 10)}
              >
                {label}
              </text>
              <rect
                className="cursor-ew-resize"
                fill="transparent"
                height={28}
                role="button"
                width={28}
                x={xPosition - 14}
                y={yPosition - 14}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startHandleDrag(event, geometry, xScale, band, handle.side, onRangeBandChange);
                }}
              />
            </g>
          );
        }),
      )}
    </g>
  );
}

function seriesForCursorBand(
  series: readonly PlotSeries[],
  band: PlotRangeBand,
): PlotSeries | undefined {
  const candidates = series.filter((item) => item.affectsScale !== false && item.points.length > 0);
  if (band.id?.startsWith("leet-der")) {
    return (
      candidates.find((item) => item.name.toLowerCase().includes("leet(der)")) ?? candidates[0]
    );
  }
  if (band.id?.startsWith("leips")) {
    return candidates.find((item) => item.yAxis === "right") ?? candidates[0];
  }
  return candidates[0];
}

function cursorYForValue(series: PlotSeries | undefined, x: number): number {
  if (!series || series.points.length === 0) {
    return 0;
  }
  return interpolateY(sortedPointsForCursor(series.points), x);
}

function sortedPointsForCursor(points: readonly Point[]): Point[] {
  return [...points].sort((left, right) => left.x - right.x);
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
