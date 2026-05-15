import {
  calculateLEIPSResult,
  calculateUPSResult,
  convertBiasToVacuumEnergy,
  createBandDiagram,
} from "../domain/analysis";
import { CUSTOM_BANDPASS_TYPE, bandpassEnergy } from "../domain/constants";
import { DEFAULT_FIT_RANGES } from "../domain/demoData";
import type { AnalysisState, FitRange, FitTarget, Point, SpectrumDataset } from "../domain/types";
import type { ProjectSnapshot } from "./projectTypes";

export function recalculateProject(project: ProjectSnapshot): ProjectSnapshot {
  const analysis = project.analysis;
  const vbDataset = findDataset(project.datasets, analysis.selection.upsVbDatasetId);
  const ipDataset = findDataset(project.datasets, analysis.selection.upsIpDatasetId);
  const leetDerDataset = findDataset(project.datasets, analysis.selection.leetDerDatasetId);
  const leipsDataset = findDataset(project.datasets, analysis.selection.leipsDatasetId);
  const errors: string[] = [];

  const ups =
    vbDataset && ipDataset
      ? safeCalculate("UPS", errors, () =>
          calculateUPSResult({
            vbDataset,
            ipDataset,
            vbEdgeRange: analysis.fitRanges.upsVbEdge,
            vbBackgroundRange: analysis.fitRanges.upsVbBackground,
            ipVbmEdgeRange: analysis.fitRanges.upsIpVbmEdge,
            ipVbmBackgroundRange: analysis.fitRanges.upsIpVbmBackground,
            cutoffEdgeRange: analysis.fitRanges.upsIpEdge,
            cutoffBackgroundRange: analysis.fitRanges.upsIpBackground,
            photonEnergy: analysis.photonEnergy,
          }),
        )
      : undefined;
  const leips =
    leetDerDataset && leipsDataset
      ? safeCalculate("LEIPS", errors, () =>
          calculateLEIPSResult({
            leetDerDataset,
            leipsDataset,
            peakRange: analysis.fitRanges.leetDerPeak,
            edgeRange: analysis.fitRanges.leipsEdge,
            backgroundRange: analysis.fitRanges.leipsBackground,
            bandpassType: analysis.bandpassType,
            bandpassEnergyEv: resolvedBandpassEnergy(analysis),
          }),
        )
      : undefined;
  const efMinusEvbm = ups
    ? ups.efMinusEvbm
    : Number.isFinite(analysis.efMinusEvbm)
      ? analysis.efMinusEvbm
      : 0;
  const band =
    ups && leips && vbDataset
      ? safeCalculate("Band", errors, () =>
          createBandDiagram({
            vbDataset,
            leipsEvacPoints: leips.leipsEvacPoints,
            efMinusEvbm,
            ip: ups.ip,
            ea: leips.ea,
          }),
        )
      : undefined;

  return {
    ...project,
    analysis: {
      ...analysis,
      efMinusEvbm,
      ups,
      leips,
      band,
      error: errors.length > 0 ? errors.join("\n") : undefined,
    },
  };
}

export function fitRangeKey(target: FitTarget): keyof AnalysisState["fitRanges"] {
  switch (target) {
    case "ups-vb-edge":
      return "upsVbEdge";
    case "ups-vb-bg":
      return "upsVbBackground";
    case "ups-ip-vbm-edge":
      return "upsIpVbmEdge";
    case "ups-ip-vbm-bg":
      return "upsIpVbmBackground";
    case "ups-ip-edge":
      return "upsIpEdge";
    case "ups-ip-bg":
      return "upsIpBackground";
    case "leips-edge":
      return "leipsEdge";
    case "leips-bg":
      return "leipsBackground";
    case "leet-der-peak":
      return "leetDerPeak";
  }
}

export function normalizeProject(project: ProjectSnapshot): ProjectSnapshot {
  return {
    ...project,
    ui: project.ui ?? {},
    analysis: {
      ...project.analysis,
      customBandpassEnergy: project.analysis.customBandpassEnergy ?? 4.77,
      fitRanges: {
        ...DEFAULT_FIT_RANGES,
        ...project.analysis.fitRanges,
      },
    },
  };
}

export function mergeDatasets(
  existing: readonly SpectrumDataset[],
  incoming: readonly SpectrumDataset[],
): SpectrumDataset[] {
  const byId = new Map(existing.map((dataset) => [dataset.id, dataset]));
  for (const dataset of incoming) {
    byId.set(dataset.id, dataset);
  }
  return [...byId.values()];
}

export function isDemoDataset(dataset: SpectrumDataset): boolean {
  return dataset.metadata.fixture === "synthetic";
}

export function autoSelectDatasets(
  datasets: readonly SpectrumDataset[],
  current: AnalysisState["selection"],
  preferred: readonly SpectrumDataset[] = [],
): AnalysisState["selection"] {
  return {
    upsVbDatasetId: pickDatasetId("ups-vb", datasets, current.upsVbDatasetId, preferred),
    upsIpDatasetId: pickDatasetId("ups-ip", datasets, current.upsIpDatasetId, preferred),
    leetDatasetId: pickDatasetId("leet", datasets, current.leetDatasetId, preferred),
    leetDerDatasetId: pickDatasetId("leet-der", datasets, current.leetDerDatasetId, preferred),
    leipsDatasetId: pickDatasetId("leips", datasets, current.leipsDatasetId, preferred),
  };
}

export function autoFitRanges(
  datasets: readonly SpectrumDataset[],
  selection: AnalysisState["selection"],
  current: AnalysisState["fitRanges"],
  preferred: readonly SpectrumDataset[],
  bandpassType: number,
  customBandpassEnergy?: number,
): AnalysisState["fitRanges"] {
  const leetDerDataset =
    preferred.find((dataset) => dataset.kind === "leet-der") ??
    findDataset(datasets, selection.leetDerDatasetId);
  const leipsDataset =
    preferred.find((dataset) => dataset.kind === "leips") ??
    findDataset(datasets, selection.leipsDatasetId);
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

export function touchProject(project: ProjectSnapshot): ProjectSnapshot {
  return { ...project, updatedAt: new Date().toISOString() };
}

function safeCalculate<T>(label: string, errors: string[], calculate: () => T): T | undefined {
  try {
    return calculate();
  } catch (error) {
    errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function pickDatasetId(
  kind: SpectrumDataset["kind"],
  datasets: readonly SpectrumDataset[],
  currentId: string | undefined,
  preferred: readonly SpectrumDataset[],
): string | undefined {
  return (
    preferred.find((dataset) => dataset.kind === kind)?.id ??
    currentId ??
    datasets.find((dataset) => dataset.kind === kind)?.id
  );
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
