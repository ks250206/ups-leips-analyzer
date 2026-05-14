import { evaluateGaussian, evaluateLine } from "../domain/fit";
import type {
  BandDiagramResult,
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

export function lineFitSeries(
  name: string,
  fit: LineFitResult,
  range: { min: number; max: number },
  color: string,
): PlotSeries {
  return {
    name,
    color,
    width: 1.5,
    dash: [6, 4],
    points: [
      { x: range.min, y: evaluateLine(fit, range.min) },
      { x: range.max, y: evaluateLine(fit, range.max) },
    ],
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
  return { name, color, width: 1.5, dash: [4, 3], points };
}

export function datasetSeries(dataset: SpectrumDataset, color: string): PlotSeries {
  return { name: dataset.name, color, points: dataset.points, width: 2 };
}

export function bandSeries(band: BandDiagramResult): PlotSeries[] {
  return [
    { name: "UPS", color: "#2563eb", points: band.upsPoints, width: 2 },
    { name: "LEIPS", color: "#dc2626", points: band.leipsPoints, width: 2 },
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
