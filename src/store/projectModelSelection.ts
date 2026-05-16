import { DEFAULT_FIT_RANGES } from "../domain/demoData";
import type { AnalysisState, SpectrumDataset, UPSIPFitRanges } from "../domain/types";

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
