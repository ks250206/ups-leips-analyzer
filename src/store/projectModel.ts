import {
  calculateLEIPSResult,
  calculateREELSResult,
  assembleUPSResult,
  calculateBiasDependence,
  calculateUPSIPResult,
  convertBiasToVacuumEnergy,
  convertKineticToLoss,
  createBandDiagram,
} from "../domain/analysis";
import { CUSTOM_BANDPASS_TYPE, bandpassEnergy } from "../domain/constants";
import { DEFAULT_FIT_RANGES } from "../domain/demoData";
import { defaultWindows } from "./projectFactory";
import { lineIntersection, linearFit } from "../domain/fit";
import { normalizeSampleInfo } from "../domain/sampleInfo";
import type {
  AnalysisState,
  BandIpSource,
  FitRange,
  FitTarget,
  Point,
  SpectrumDataset,
  UPSIPFitRanges,
  UPSIPResult,
} from "../domain/types";
import type { ProjectSnapshot } from "./projectTypes";

export function recalculateProject(project: ProjectSnapshot): ProjectSnapshot {
  const analysis = project.analysis;
  const vbDataset = findDataset(project.datasets, analysis.selection.upsVbDatasetId);
  const ipDatasetIds = selectedUpsIpDatasetIds(analysis.selection);
  const ipDatasets = ipDatasetIds
    .map((datasetId) => findDataset(project.datasets, datasetId))
    .filter((dataset): dataset is SpectrumDataset => Boolean(dataset));
  const leetDerDataset = findDataset(project.datasets, analysis.selection.leetDerDatasetId);
  const leipsDataset = findDataset(project.datasets, analysis.selection.leipsDatasetId);
  const reelsDataset = findDataset(project.datasets, analysis.selection.reelsDatasetId);
  const errors: string[] = [];

  const ups = vbDataset
    ? safeCalculate("UPS", errors, () => {
        const vbEdge = linearFitForProject(vbDataset, analysis.fitRanges.upsVbEdge);
        const vbBackground = linearFitForProject(vbDataset, analysis.fitRanges.upsVbBackground);
        const vbEvbm = lineIntersectionForProject(vbEdge, vbBackground);
        const ipResults = ipDatasets
          .map((dataset) =>
            safeCalculate(`UPS IP ${dataset.name}`, errors, () =>
              calculateUPSIPResult({
                dataset,
                ranges: upsIpRangesForDataset(analysis, dataset.id),
                appliedVoltage: appliedVoltageForDataset(analysis, dataset),
                photonEnergy: analysis.photonEnergy,
              }),
            ),
          )
          .filter((result): result is UPSIPResult => Boolean(result));
        return assembleUPSResult({ vbEvbm, vbEdge, vbBackground, ipResults });
      })
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
            ip: resolveBandIp(ups.ipResults, analysis.bandIpSource),
            ea: leips.ea,
          }),
        )
      : undefined;
  const reels = reelsDataset
    ? safeCalculate("REELS", errors, () =>
        calculateREELSResult({
          dataset: reelsDataset,
          edgeRange: analysis.fitRanges.reelsEdge,
          backgroundRange: analysis.fitRanges.reelsBackground,
          incidentEnergy: analysis.reelsIncidentEnergy,
          backgroundMode: project.ui?.reelsBackgroundMode,
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
      reels,
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
    case "reels-edge":
      return "reelsEdge";
    case "reels-bg":
      return "reelsBackground";
  }
}

export function normalizeProject(project: ProjectSnapshot): ProjectSnapshot {
  return {
    ...project,
    windows: normalizeWindows(project.windows),
    ui: {
      ...project.ui,
      sampleInfo: normalizeSampleInfo(project.ui?.sampleInfo),
    },
    analysis: {
      ...project.analysis,
      customBandpassEnergy: project.analysis.customBandpassEnergy ?? 4.77,
      reelsIncidentEnergy: project.analysis.reelsIncidentEnergy ?? 1000,
      fitRanges: {
        ...DEFAULT_FIT_RANGES,
        ...project.analysis.fitRanges,
      },
      selection: normalizeSelection(project.analysis.selection),
      upsIpFitRangesByDatasetId: normalizeUpsIpFitRanges(project),
      upsIpConfigsByDatasetId: normalizeUpsIpConfigs(project),
      bandIpSource: project.analysis.bandIpSource ?? defaultBandIpSource(project.analysis),
    },
  };
}

function normalizeWindows(windows: ProjectSnapshot["windows"]): ProjectSnapshot["windows"] {
  const defaults = defaultWindows();
  return windows.map((window) => {
    if (window.id === "controls" && window.width > 360) {
      const defaultWindow = defaults.find((item) => item.id === "controls");
      return defaultWindow ? { ...window, x: defaultWindow.x, width: defaultWindow.width } : window;
    }
    if ((window.id === "leips" || window.id === "leips-evac") && window.height < 370) {
      const defaultWindow = defaults.find((item) => item.id === window.id);
      return defaultWindow ? { ...window, height: defaultWindow.height } : window;
    }
    if ((window.id === "band" || window.id === "reels") && window.y < 1110) {
      const defaultWindow = defaults.find((item) => item.id === window.id);
      return defaultWindow ? { ...window, y: defaultWindow.y } : window;
    }
    if (window.id !== "ups-bias" || (window.width > 600 && window.y <= 728)) {
      return window;
    }
    const defaultWindow = defaults.find((item) => item.id === "ups-bias");
    return defaultWindow
      ? { ...window, x: defaultWindow.x, width: defaultWindow.width, height: defaultWindow.height }
      : window;
  });
}

function defaultBandIpSource(analysis: AnalysisState): BandIpSource {
  return { mode: "dataset", datasetId: selectedUpsIpDatasetIds(analysis.selection)[0] };
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
  const currentIpIds = selectedUpsIpDatasetIds(current).filter((datasetId) =>
    datasets.some((dataset) => dataset.id === datasetId && dataset.kind === "ups-ip"),
  );
  const preferredIpIds = preferred
    .filter((dataset) => dataset.kind === "ups-ip")
    .map((dataset) => dataset.id);
  const allIpIds =
    preferredIpIds.length > 0
      ? preferredIpIds
      : currentIpIds.length > 0
        ? currentIpIds
        : datasets.filter((dataset) => dataset.kind === "ups-ip").map((dataset) => dataset.id);
  return {
    upsVbDatasetId: pickDatasetId("ups-vb", datasets, current.upsVbDatasetId, preferred),
    upsIpDatasetIds: allIpIds,
    leetDatasetId: pickDatasetId("leet", datasets, current.leetDatasetId, preferred),
    leetDerDatasetId: pickDatasetId("leet-der", datasets, current.leetDerDatasetId, preferred),
    leipsDatasetId: pickDatasetId("leips", datasets, current.leipsDatasetId, preferred),
    reelsDatasetId: pickDatasetId("reels", datasets, current.reelsDatasetId, preferred),
  };
}

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

function linearFitForProject(dataset: SpectrumDataset, range: FitRange) {
  return linearFit(dataset.points, range);
}

function lineIntersectionForProject(
  left: ReturnType<typeof linearFit>,
  right: ReturnType<typeof linearFit>,
) {
  return lineIntersection(left, right);
}

export function selectedUpsIpDatasetIds(selection: AnalysisState["selection"]): string[] {
  if (Array.isArray(selection.upsIpDatasetIds)) {
    return selection.upsIpDatasetIds.filter(Boolean);
  }
  return selection.upsIpDatasetId ? [selection.upsIpDatasetId] : [];
}

export function defaultUpsIpRanges(): UPSIPFitRanges {
  return {
    ipVbmEdge: DEFAULT_FIT_RANGES.upsIpVbmEdge,
    ipVbmBackground: DEFAULT_FIT_RANGES.upsIpVbmBackground,
    cutoffEdge: DEFAULT_FIT_RANGES.upsIpEdge,
    cutoffBackground: DEFAULT_FIT_RANGES.upsIpBackground,
  };
}

export function upsIpRangesForDataset(analysis: AnalysisState, datasetId: string): UPSIPFitRanges {
  return analysis.upsIpFitRangesByDatasetId?.[datasetId] ?? defaultUpsIpRanges();
}

export function appliedVoltageForDataset(
  analysis: AnalysisState,
  dataset: SpectrumDataset,
): number {
  const configured = analysis.upsIpConfigsByDatasetId?.[dataset.id]?.appliedVoltage;
  if (configured !== undefined && Number.isFinite(configured)) {
    return configured;
  }
  const parsed = Number(dataset.metadata.appliedVoltage);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolveBandIp(
  ipResults: readonly UPSIPResult[],
  source: BandIpSource | undefined,
): number {
  const finiteResults = ipResults.filter((result) => Number.isFinite(result.ip));
  const resolvedSource = source ?? { mode: "dataset" };
  if (resolvedSource.mode === "average") {
    return average(finiteResults.map((result) => result.ip));
  }
  if (resolvedSource.mode === "zero-voltage-extrapolated") {
    const dependence = calculateBiasDependence(
      finiteResults.map((result) => ({
        voltage: result.appliedVoltage,
        value: result.ip,
      })),
    );
    if (!dependence) {
      throw new Error("Band: 0 V extrapolated IP requires at least two valid UPS IP datasets.");
    }
    return dependence.valueAtZero;
  }
  return (
    finiteResults.find((result) => result.datasetId === resolvedSource.datasetId)?.ip ??
    finiteResults[0]?.ip ??
    Number.NaN
  );
}

function average(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) {
    return Number.NaN;
  }
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function normalizeSelection(selection: AnalysisState["selection"]): AnalysisState["selection"] {
  const upsIpDatasetIds = selectedUpsIpDatasetIds(selection);
  return {
    upsVbDatasetId: selection.upsVbDatasetId,
    upsIpDatasetIds,
    leetDatasetId: selection.leetDatasetId,
    leetDerDatasetId: selection.leetDerDatasetId,
    leipsDatasetId: selection.leipsDatasetId,
    reelsDatasetId: selection.reelsDatasetId,
  };
}

function normalizeUpsIpFitRanges(project: ProjectSnapshot): Record<string, UPSIPFitRanges> {
  const current = project.analysis.upsIpFitRangesByDatasetId ?? {};
  const ids = selectedUpsIpDatasetIds(project.analysis.selection);
  const next: Record<string, UPSIPFitRanges> = { ...current };
  for (const id of ids) {
    next[id] = next[id] ?? {
      ipVbmEdge: project.analysis.fitRanges?.upsIpVbmEdge ?? DEFAULT_FIT_RANGES.upsIpVbmEdge,
      ipVbmBackground:
        project.analysis.fitRanges?.upsIpVbmBackground ?? DEFAULT_FIT_RANGES.upsIpVbmBackground,
      cutoffEdge: project.analysis.fitRanges?.upsIpEdge ?? DEFAULT_FIT_RANGES.upsIpEdge,
      cutoffBackground:
        project.analysis.fitRanges?.upsIpBackground ?? DEFAULT_FIT_RANGES.upsIpBackground,
    };
  }
  return next;
}

function normalizeUpsIpConfigs(
  project: ProjectSnapshot,
): NonNullable<AnalysisState["upsIpConfigsByDatasetId"]> {
  const current = project.analysis.upsIpConfigsByDatasetId ?? {};
  const next = { ...current };
  for (const id of selectedUpsIpDatasetIds(project.analysis.selection)) {
    const dataset = findDataset(project.datasets, id);
    next[id] = next[id] ?? {
      appliedVoltage: dataset ? appliedVoltageForDataset(project.analysis, dataset) : 0,
    };
  }
  return next;
}

function pickDatasetId(
  kind: SpectrumDataset["kind"],
  datasets: readonly SpectrumDataset[],
  currentId: string | undefined,
  preferred: readonly SpectrumDataset[],
): string | undefined {
  const current = datasets.find((dataset) => dataset.id === currentId && dataset.kind === kind);
  return (
    preferred.find((dataset) => dataset.kind === kind)?.id ??
    current?.id ??
    datasets.find((dataset) => dataset.kind === kind)?.id
  );
}

export function axisLabelForDatasetKind(kind: SpectrumDataset["kind"]): string {
  if (kind === "leet" || kind === "leet-der" || kind === "leips") {
    return "Applied Bias Vbias / V";
  }
  if (kind === "reels") {
    return "Kinetic Energy / eV";
  }
  return "Binding Energy / eV";
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
