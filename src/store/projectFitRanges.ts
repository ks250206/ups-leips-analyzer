import { convertBiasToVacuumEnergy, convertKineticToLoss } from "../domain/analysis";
import { CUSTOM_BANDPASS_TYPE, bandpassEnergy } from "../domain/constants";
import { DEFAULT_FIT_RANGES } from "../domain/demoData";
import type { AnalysisState, FitRange, Point, SpectrumDataset } from "../domain/types";

export function autoFitRanges(
  datasets: readonly SpectrumDataset[],
  selection: AnalysisState["selection"],
  current: AnalysisState["fitRanges"],
  preferred: readonly SpectrumDataset[],
  bandpassType: number,
  customBandpassEnergy?: number,
  reelsIncidentEnergy = 1000,
): AnalysisState["fitRanges"] {
  const leetDerDataset =
    preferred.find((dataset) => dataset.kind === "leet-der") ??
    findDataset(datasets, selection.leetDerDatasetId);
  const leipsDataset =
    preferred.find((dataset) => dataset.kind === "leips") ??
    findDataset(datasets, selection.leipsDatasetId);
  const reelsDataset =
    preferred.find((dataset) => dataset.kind === "reels") ??
    findDataset(datasets, selection.reelsDatasetId);
  const shouldInitializePeak = preferred.some((dataset) => dataset.kind === "leet-der");
  const leetDerPeak =
    leetDerDataset && shouldInitializePeak
      ? peakCenteredRange(leetDerDataset, 1)
      : current.leetDerPeak;
  const leipsEvacPoints =
    leetDerDataset && leipsDataset
      ? estimateLeipsEvacPoints(
          leetDerDataset,
          leipsDataset,
          leetDerPeak,
          resolvedBandpassEnergy({ bandpassType, customBandpassEnergy }),
        )
      : [];
  return {
    ...current,
    leetDerPeak,
    leipsEdge: rangeWithFallback(leipsEvacPoints, current.leipsEdge, 0.05, 0.22),
    leipsBackground: rangeWithFallback(leipsEvacPoints, current.leipsBackground, 0.34, 0.56),
    reelsEdge: rangeWithFallback(
      reelsDataset ? convertKineticToLoss(reelsDataset.points, reelsIncidentEnergy) : [],
      current.reelsEdge,
      0.18,
      0.32,
    ),
    reelsBackground: rangeWithFallback(
      reelsDataset ? convertKineticToLoss(reelsDataset.points, reelsIncidentEnergy) : [],
      current.reelsBackground,
      0.02,
      0.14,
    ),
  };
}

export function resolvedBandpassEnergy(input: {
  bandpassType: number;
  customBandpassEnergy?: number;
}): number {
  return input.bandpassType === CUSTOM_BANDPASS_TYPE
    ? (input.customBandpassEnergy ?? 0)
    : bandpassEnergy(input.bandpassType);
}

function peakCenteredRange(dataset: SpectrumDataset, width: number): FitRange {
  if (dataset.points.length === 0) {
    return DEFAULT_FIT_RANGES.leetDerPeak;
  }
  const maxPoint = dataset.points.reduce((currentMax, point) =>
    point.y > currentMax.y ? point : currentMax,
  );
  const minX = Math.min(...dataset.points.map((point) => point.x));
  const maxX = Math.max(...dataset.points.map((point) => point.x));
  const halfWidth = width / 2;
  const span = maxX - minX;
  if (span <= width) {
    return { min: minX, max: maxX };
  }
  const min = Math.min(Math.max(maxPoint.x - halfWidth, minX), maxX - width);
  return { min, max: min + width };
}

function estimateLeipsEvacPoints(
  leetDerDataset: SpectrumDataset,
  leipsDataset: SpectrumDataset,
  peakRange: FitRange,
  bandpass: number,
): Point[] {
  const selected = leetDerDataset.points.filter(
    (point) => point.x >= peakRange.min && point.x <= peakRange.max,
  );
  const peakCandidates = selected.length > 0 ? selected : leetDerDataset.points;
  if (peakCandidates.length === 0) {
    return [];
  }
  const peakPoint = peakCandidates.reduce((currentMax, point) =>
    point.y > currentMax.y ? point : currentMax,
  );
  return convertBiasToVacuumEnergy(leipsDataset.points, peakPoint.x + bandpass);
}

function rangeWithFallback(
  points: readonly Point[],
  current: FitRange,
  startFraction: number,
  endFraction: number,
): FitRange {
  if (countPointsInRange(points, current) >= 2) {
    return current;
  }
  const sortedX = points
    .map((point) => point.x)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (sortedX.length < 2) {
    return current;
  }
  const startIndex = Math.min(Math.floor((sortedX.length - 1) * startFraction), sortedX.length - 2);
  const endIndex = Math.max(Math.ceil((sortedX.length - 1) * endFraction), startIndex + 1);
  return { min: sortedX[startIndex] ?? current.min, max: sortedX[endIndex] ?? current.max };
}

function countPointsInRange(points: readonly Point[], range: FitRange): number {
  const min = Math.min(range.min, range.max);
  const max = Math.max(range.min, range.max);
  return points.filter((point) => point.x >= min && point.x <= max).length;
}

function findDataset(
  datasets: readonly SpectrumDataset[],
  id?: string,
): SpectrumDataset | undefined {
  return datasets.find((dataset) => dataset.id === id);
}
