import type { AnalysisState, SpectrumDataset } from "../domain/types";
import { defaultUpsIpRanges, selectedUpsIpDatasetIds } from "./projectModel";

const SELECTION_KIND: Record<
  Exclude<keyof AnalysisState["selection"], "upsIpDatasetIds" | "upsIpDatasetId">,
  SpectrumDataset["kind"]
> = {
  upsVbDatasetId: "ups-vb",
  leetDatasetId: "leet",
  leetDerDatasetId: "leet-der",
  leipsDatasetId: "leips",
  reelsDatasetId: "reels",
};

export function keepOnlyMatchingSelections(
  datasets: readonly SpectrumDataset[],
  selection: AnalysisState["selection"],
): AnalysisState["selection"] {
  const next: AnalysisState["selection"] = {};
  for (const [slot, kind] of Object.entries(SELECTION_KIND) as Array<
    [
      Exclude<keyof AnalysisState["selection"], "upsIpDatasetIds" | "upsIpDatasetId">,
      SpectrumDataset["kind"],
    ]
  >) {
    const datasetId = selection[slot];
    if (datasets.some((dataset) => dataset.id === datasetId && dataset.kind === kind)) {
      next[slot] = datasetId;
    }
  }
  next.upsIpDatasetIds = selectedUpsIpDatasetIds(selection).filter((datasetId) =>
    datasets.some((dataset) => dataset.id === datasetId && dataset.kind === "ups-ip"),
  );
  return next;
}

export function seedUpsIpFitRanges(
  current: AnalysisState["upsIpFitRangesByDatasetId"] | undefined,
  datasetIds: readonly string[],
): NonNullable<AnalysisState["upsIpFitRangesByDatasetId"]> {
  const next = { ...current };
  for (const datasetId of datasetIds) {
    next[datasetId] = next[datasetId] ?? defaultUpsIpRanges();
  }
  return next;
}

export function seedUpsIpConfigs(
  current: AnalysisState["upsIpConfigsByDatasetId"] | undefined,
  datasets: readonly SpectrumDataset[],
  datasetIds: readonly string[],
): NonNullable<AnalysisState["upsIpConfigsByDatasetId"]> {
  const next = { ...current };
  for (const datasetId of datasetIds) {
    const dataset = datasets.find((item) => item.id === datasetId);
    const voltage = Number(dataset?.metadata.appliedVoltage);
    next[datasetId] = next[datasetId] ?? {
      appliedVoltage: Number.isFinite(voltage) ? voltage : 0,
    };
  }
  return next;
}

export function omitKeys<T>(
  record: Record<string, T> | undefined,
  keys: readonly string[],
): Record<string, T> | undefined {
  if (!record) {
    return undefined;
  }
  const next = { ...record };
  for (const key of keys) {
    delete next[key];
  }
  return next;
}
