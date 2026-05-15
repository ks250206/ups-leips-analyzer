import { scaleLinear, type ScaleLinear } from "d3-scale";
import { line } from "d3-shape";
import type { BandDiagramResult, Point } from "../../domain/types";

export interface IgorBandModel {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  yRightScale: ScaleLinear<number, number>;
  upsPath: string | null;
  leipsPath: string | null;
  xTicks: number[];
  geometry: BandGeometry;
  xDomain: BandScaleRange;
  yDomain: BandScaleRange;
  yRightDomain: BandScaleRange;
  plotTop: number;
  plotBottom: number;
}

export interface BandScaleRange {
  min: number;
  max: number;
}

export interface BandViewport {
  x?: BandScaleRange;
  y?: BandScaleRange;
  y2?: BandScaleRange;
}

export interface BandGeometry {
  left: number;
  top: number;
  plotRight: number;
  plotBottom: number;
  plotWidth: number;
  plotHeight: number;
}

export interface BandDragState {
  start: { left: number; top: number };
  current: { left: number; top: number };
}

export function createIgorBandModel(input: {
  band: BandDiagramResult;
  xDomain: { min: number; max: number };
  upsScale: number;
  upsOffset: number;
  leipsScale: number;
  leipsOffset: number;
  viewport?: BandViewport;
  geometry: { left: number; top: number; plotRight: number; plotBottom: number };
}): IgorBandModel {
  const geometry = {
    ...input.geometry,
    plotWidth: input.geometry.plotRight - input.geometry.left,
    plotHeight: input.geometry.plotBottom - input.geometry.top,
  };
  const upsPoints = transformBandPoints(input.band.upsPoints, input.upsScale, input.upsOffset);
  const leipsPoints = transformBandPoints(
    input.band.leipsPoints,
    input.leipsScale,
    input.leipsOffset,
  );
  const xDomain = input.viewport?.x ?? input.xDomain;
  const yDomain = input.viewport?.y ?? domainForY(upsPoints);
  const yRightDomain = input.viewport?.y2 ?? domainForY(leipsPoints);
  const xScale = scaleLinear<number, number>()
    .domain([xDomain.min, xDomain.max])
    .range([geometry.plotRight, geometry.left]);
  const upsScale = scaleLinear<number, number>()
    .domain([yDomain.min, yDomain.max])
    .range([geometry.plotBottom, geometry.top]);
  const leipsScale = scaleLinear<number, number>()
    .domain([yRightDomain.min, yRightDomain.max])
    .range([geometry.plotBottom, geometry.top]);
  const pathLine = line<Point>()
    .x((point) => xScale(point.x))
    .y((point) => upsScale(point.y));
  const leipsLine = line<Point>()
    .x((point) => xScale(point.x))
    .y((point) => leipsScale(point.y));

  return {
    xScale,
    yScale: upsScale,
    yRightScale: leipsScale,
    upsPath: pathLine(sortedByX(upsPoints)),
    leipsPath: leipsLine(sortedByX(leipsPoints)),
    xTicks: xScale.ticks(6),
    geometry,
    xDomain,
    yDomain,
    yRightDomain,
    plotTop: geometry.top,
    plotBottom: geometry.plotBottom,
  };
}

export function createBandAutoViewport(input: {
  band: BandDiagramResult;
  xDomain: { min: number; max: number };
  upsScale: number;
  upsOffset: number;
  leipsScale: number;
  leipsOffset: number;
}): Required<BandViewport> {
  return {
    x: { min: input.xDomain.min, max: input.xDomain.max },
    y: domainForY(input.band.upsPoints),
    y2: domainForY(input.band.leipsPoints),
  };
}

export function bandPlotDataSignature(band: BandDiagramResult): string {
  return `${pointSeriesSignature(band.upsPoints)}|${pointSeriesSignature(band.leipsPoints)}`;
}

function pointSeriesSignature(points: readonly Point[]): string {
  if (points.length === 0) {
    return "0";
  }
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (const point of points) {
    min = Math.min(min, point.x);
    max = Math.max(max, point.x);
    sum += point.x;
  }
  return `${points.length}:${min.toFixed(6)}:${max.toFixed(6)}:${sum.toFixed(6)}`;
}

function transformBandPoints(
  points: readonly Point[],
  scale: number,
  offsetPercent: number,
): Point[] {
  const offset = offsetFromPercent(points, offsetPercent);
  return points.map((point) => ({
    x: point.x,
    y: point.y * scale + offset,
  }));
}

function domainForY(points: readonly Point[]): BandScaleRange {
  const values = points.map((point) => point.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  return { min: min - span * 0.02, max: max + span * 0.12 };
}

function offsetFromPercent(points: readonly Point[], percent: number): number {
  if (points.length === 0) {
    return 0;
  }
  const values = points.map((point) => point.y);
  return ((Math.max(...values) - Math.min(...values)) * percent) / 100;
}

function sortedByX(points: readonly Point[]): Point[] {
  return [...points].sort((a, b) => a.x - b.x);
}
