import { extent } from "d3-array";
import { scaleLinear, type ScaleLinear } from "d3-scale";
import type { Point } from "../../domain/types";
import type { PlotSeries } from "../plotData";

export interface SpectrumPlotScaleInput {
  size: { width: number; height: number };
  series: readonly PlotSeries[];
  xDirection: "normal" | "reverse";
  largeAxisLabels?: boolean;
  marginVariant?: "normal" | "leips";
  viewport?: PlotViewport;
}

export interface PlotGeometry {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  plotWidth: number;
  plotHeight: number;
  plotRight: number;
  plotBottom: number;
}

export interface PlotScaleRange {
  min: number;
  max: number;
}

export interface PlotViewport {
  x?: PlotScaleRange;
  y?: PlotScaleRange;
  y2?: PlotScaleRange;
}

export interface PlotScales {
  geometry: PlotGeometry;
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  yRightScale?: ScaleLinear<number, number>;
  xDomain: PlotScaleRange;
  yDomain: PlotScaleRange;
  yRightDomain?: PlotScaleRange;
}

export interface DragState {
  start: { left: number; top: number };
  current: { left: number; top: number };
  shiftKey: boolean;
}

export const DEFAULT_SIZE = { width: 640, height: 360 };
export const MIN_PLOT_SIZE = { width: 260, height: 190 };
export function createPlotGeometry(
  size: { width: number; height: number },
  largeAxisLabels = false,
  hasRightAxis = false,
  marginVariant: "normal" | "leips" = "normal",
): PlotGeometry {
  const width = Math.max(MIN_PLOT_SIZE.width, Math.floor(size.width));
  const height = Math.max(MIN_PLOT_SIZE.height, Math.floor(size.height));
  const top = largeAxisLabels ? 44 : 20;
  const right = largeAxisLabels
    ? 78
    : marginVariant === "leips"
      ? hasRightAxis
        ? 70
        : 36
      : hasRightAxis
        ? 50
        : 30;
  const bottom = largeAxisLabels ? 62 : 44;
  const left = largeAxisLabels ? 96 : marginVariant === "leips" ? 76 : 78;
  const plotWidth = Math.max(40, width - left - right);
  const plotHeight = Math.max(40, height - top - bottom);
  return {
    width,
    height,
    top,
    right,
    bottom,
    left,
    plotWidth,
    plotHeight,
    plotRight: left + plotWidth,
    plotBottom: top + plotHeight,
  };
}

export function createPlotScales(input: SpectrumPlotScaleInput): PlotScales {
  const hasRightAxis = input.series.some((item) => item.yAxis === "right");
  const geometry = createPlotGeometry(
    input.size,
    input.largeAxisLabels ?? false,
    hasRightAxis,
    input.marginVariant ?? "normal",
  );
  const xDomain = input.viewport?.x ?? domainForX(input.series);
  const yDomain =
    input.viewport?.y ?? domainForY(input.series.filter((item) => item.yAxis !== "right"));
  const rightSeries = input.series.filter((item) => item.yAxis === "right");
  const yRightDomain =
    input.viewport?.y2 ?? (rightSeries.length > 0 ? domainForY(rightSeries) : undefined);
  const xRange =
    input.xDirection === "reverse"
      ? [geometry.plotRight, geometry.left]
      : [geometry.left, geometry.plotRight];

  return {
    geometry,
    xScale: scaleLinear().domain([xDomain.min, xDomain.max]).range(xRange),
    yScale: scaleLinear()
      .domain([yDomain.min, yDomain.max])
      .range([geometry.plotBottom, geometry.top]),
    yRightScale: yRightDomain
      ? scaleLinear()
          .domain([yRightDomain.min, yRightDomain.max])
          .range([geometry.plotBottom, geometry.top])
      : undefined,
    xDomain,
    yDomain,
    yRightDomain,
  };
}

export function sizeFor(element: HTMLElement): { width: number; height: number } {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(MIN_PLOT_SIZE.width, Math.floor(rect.width)),
    height: Math.max(MIN_PLOT_SIZE.height, Math.floor(rect.height)),
  };
}

function domainForX(series: readonly PlotSeries[]): PlotScaleRange {
  const scaleSeries = series.filter((item) => item.affectsScale ?? true);
  const points = (scaleSeries.length > 0 ? scaleSeries : series).flatMap((item) => item.points);
  return paddedDomain(extent(points, (point) => point.x));
}

function domainForY(series: readonly PlotSeries[]): PlotScaleRange {
  const scaleSeries = series.filter((item) => item.affectsScale ?? true);
  const points = (scaleSeries.length > 0 ? scaleSeries : series).flatMap((item) => item.points);
  return paddedDomain(extent(points, (point) => point.y));
}

function paddedDomain(valueExtent: [number | undefined, number | undefined]): PlotScaleRange {
  const min = Number(valueExtent[0]);
  const max = Number(valueExtent[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (Math.abs(max - min) < 1e-12) {
    const padding = Math.max(Math.abs(min) * 0.05, 1);
    return { min: min - padding, max: max + padding };
  }
  const padding = Math.max((max - min) * 0.05, 1e-9);
  return { min: min - padding, max: max + padding };
}

export function sortedPoints(points: readonly Point[]): Point[] {
  return [...points].sort((left, right) => left.x - right.x);
}
export function formatTickParts(value: number): { mantissa: string; exponent?: number } {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const exponent = Math.floor(Math.log10(abs));
    const mantissa = value / 10 ** exponent;
    return {
      mantissa: mantissa.toPrecision(2),
      exponent,
    };
  }
  if (abs >= 100 || abs === 0) {
    return { mantissa: value.toFixed(0) };
  }
  if (abs >= 10) {
    return { mantissa: value.toFixed(1).replace(/\.0$/, "") };
  }
  return { mantissa: value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") };
}
