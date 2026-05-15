import { evaluateGaussian, evaluateLine } from "../domain/fit";
import type {
  BandDiagramResult,
  FitRange,
  GaussianFitResult,
  LineFitResult,
  Point,
  SpectrumDataset,
} from "../domain/types";

export interface PlotSeries {
  name: string;
  color: string;
  points: Point[];
  width?: number;
  dash?: number[];
  yAxis?: "left" | "right";
  affectsScale?: boolean;
  fitRange?: FitRange;
  fitLabel?: string;
}

export interface PlotMarker {
  x: number;
  label: string;
  color: string;
}

export interface PlotRangeBand {
  id?: string;
  min: number;
  max: number;
  label: string;
  color: string;
  cursorLabels?: readonly [string, string];
}

export type PlotAnnotation =
  | {
      type: "text";
      label: string;
      color: string;
      xFraction: number;
      yFraction: number;
      fontSize?: number;
      anchor?: "start" | "middle" | "end";
    }
  | {
      type: "x-arrow";
      label: string;
      color: string;
      x1: number;
      x2: number;
      yFraction: number;
      fontSize?: number;
      strokeWidth?: number;
    };

export function lineFitSeries(
  name: string,
  fit: LineFitResult,
  range: { min: number; max: number },
  color: string,
  extent: { min: number; max: number } = range,
  fitLabel?: string,
): PlotSeries {
  return {
    name,
    color,
    width: 1.5,
    dash: [6, 4],
    affectsScale: false,
    fitRange: range,
    fitLabel,
    points: [
      { x: extent.min, y: evaluateLine(fit, extent.min) },
      { x: extent.max, y: evaluateLine(fit, extent.max) },
    ],
  };
}

export function xExtent(points: readonly Point[]): FitRange {
  return {
    min: Math.min(...points.map((point) => point.x)),
    max: Math.max(...points.map((point) => point.x)),
  };
}

export function gaussianSeries(
  name: string,
  fit: GaussianFitResult,
  source: readonly Point[],
  color: string,
): PlotSeries {
  const min = Math.min(...source.map((point) => point.x));
  const max = Math.max(...source.map((point) => point.x));
  const step = (max - min) / 160;
  const points: Point[] = [];
  for (let index = 0; index <= 160; index += 1) {
    const x = min + step * index;
    points.push({ x, y: evaluateGaussian(fit, x) });
  }
  return { name, color, width: 1.5, dash: [4, 3], points, affectsScale: false };
}

export function datasetSeries(
  dataset: SpectrumDataset,
  color: string,
  yAxis: PlotSeries["yAxis"] = "left",
): PlotSeries {
  return { name: dataset.name, color, points: dataset.points, width: 2, yAxis };
}

export function bandSeries(band: BandDiagramResult): PlotSeries[] {
  return [
    { name: "UPS", color: "#2563eb", points: band.upsPoints, width: 2, yAxis: "left" },
    { name: "LEIPS", color: "#dc2626", points: band.leipsPoints, width: 2, yAxis: "right" },
  ];
}

export function alignSeries(
  series: readonly PlotSeries[],
): [number[], ...Array<Array<number | null>>] {
  const xValues = [
    ...new Set(series.flatMap((item) => item.points.map((point) => roundKey(point.x)))),
  ].sort((a, b) => a - b);
  const aligned = series.map((item) => {
    const byX = new Map(item.points.map((point) => [roundKey(point.x), point.y]));
    return xValues.map((x) => byX.get(x) ?? null);
  });
  return [xValues, ...aligned];
}

function roundKey(value: number): number {
  return Number(value.toFixed(6));
}
