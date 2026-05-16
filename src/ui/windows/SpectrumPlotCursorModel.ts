import type { ScaleLinear } from "d3-scale";
import type { Point } from "../../domain/types";
import type { PlotRangeBand, PlotSeries } from "../plotData";
import { interpolateY } from "./SpectrumPlotSeries";

export function singlePointForBand(
  series: readonly PlotSeries[],
  band: PlotRangeBand,
  yScale: ScaleLinear<number, number>,
  yRightScale?: ScaleLinear<number, number>,
): { x: number; yPosition: number } | undefined {
  const targetSeries = seriesForCursorBand(series, band);
  if (!targetSeries) {
    return undefined;
  }
  const x = (band.min + band.max) / 2;
  const y = cursorYForValue(targetSeries, x);
  const scale = targetSeries.yAxis === "right" && yRightScale ? yRightScale : yScale;
  return { x, yPosition: scale(y) };
}

export function seriesForCursorBand(
  series: readonly PlotSeries[],
  band: PlotRangeBand,
): PlotSeries | undefined {
  const candidates = series.filter((item) => item.affectsScale !== false && item.points.length > 0);
  if (band.cursorSeriesName) {
    const expected = normalizeSeriesName(band.cursorSeriesName);
    const selected = candidates.find((item) => normalizeSeriesName(item.name) === expected);
    if (selected) {
      return selected;
    }
  }
  if (band.id?.startsWith("leet-der")) {
    return (
      candidates.find((item) => {
        const name = normalizeSeriesName(item.name);
        return name.includes("leetder") || (name.includes("leet") && name.includes("der"));
      }) ?? candidates[0]
    );
  }
  if (band.id?.startsWith("leips")) {
    return candidates.find((item) => item.yAxis === "right") ?? candidates[0];
  }
  return candidates[0];
}

export function cursorYForValue(series: PlotSeries | undefined, x: number): number {
  if (!series || series.points.length === 0) {
    return 0;
  }
  return interpolateY(sortedPointsForCursor(series.points), x);
}

function normalizeSeriesName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function sortedPointsForCursor(points: readonly Point[]): Point[] {
  return [...points].sort((left, right) => left.x - right.x);
}
