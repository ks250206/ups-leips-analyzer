import type { ScaleLinear } from "d3-scale";
import { line } from "d3-shape";
import type { Point } from "../../domain/types";
import type { PlotSeries } from "../plotData";
import {
  shouldRenderSeriesInXDomain,
  sortedPoints,
  type PlotGeometry,
  type PlotScaleRange,
} from "./SpectrumPlotModel";

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
      {(series.width ?? 2) > 0 ? (
        <path
          d={path}
          fill="none"
          stroke={series.color}
          strokeDasharray={series.dash?.join(" ")}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={series.width ?? 2}
        />
      ) : null}
      {series.pointRadius
        ? sortedPoints(series.points).map((point) =>
            Number.isFinite(point.x) && Number.isFinite(point.y) ? (
              <circle
                key={`${series.name}-${point.x}-${point.y}`}
                cx={xScale(point.x)}
                cy={yScale(point.y)}
                fill={series.color}
                r={series.pointRadius}
              />
            ) : null,
          )
        : null}
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
  const textHalfWidth = Math.max(
    24,
    (typeof series.fitLabel === "string" ? series.fitLabel.length : 8) * 3.6,
  );
  return {
    x: clamp(xScale(targetX), geometry.left + textHalfWidth, geometry.plotRight - textHalfWidth),
    y: clamp(yScale(targetY) - 6, geometry.top + 14, geometry.plotBottom - 8),
  };
}

export function interpolateY(points: readonly Point[], x: number): number {
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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function fitLabelEdgeX(min: number, max: number, xScale: ScaleLinear<number, number>): number {
  return xScale(min) <= xScale(max) ? min : max;
}
