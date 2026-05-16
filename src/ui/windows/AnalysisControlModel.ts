import { calculateBiasDependence } from "../../domain/analysis";
import type {
  AnalysisSelection,
  AnalysisState,
  FitTarget,
  SpectrumDataset,
} from "../../domain/types";

export const FIT_TARGETS: Array<{ target: FitTarget; label: string }> = [
  { target: "ups-vb-edge", label: "VB set edge" },
  { target: "ups-vb-bg", label: "BG(VB set)" },
  { target: "ups-ip-vbm-edge", label: "IP EVBM edge" },
  { target: "ups-ip-vbm-bg", label: "BG(IP EVBM)" },
  { target: "ups-ip-edge", label: "Ecut-off edge" },
  { target: "ups-ip-bg", label: "BG(Ecut-off)" },
  { target: "leet-der-peak", label: "LEET(der) peak" },
  { target: "leips-edge", label: "CBM edge" },
  { target: "leips-bg", label: "BG(LEIPS)" },
  { target: "reels-edge", label: "REELS onset" },
  { target: "reels-bg", label: "BG(REELS)" },
];

export const DATASET_SLOTS: Array<{
  slot: keyof AnalysisSelection;
  label: string;
  filter: (dataset: SpectrumDataset) => boolean;
}> = [
  { slot: "upsVbDatasetId", label: "UPS VB", filter: (dataset) => dataset.kind === "ups-vb" },
  { slot: "upsIpDatasetId", label: "UPS IP", filter: (dataset) => dataset.kind === "ups-ip" },
  { slot: "leetDatasetId", label: "LEET", filter: (dataset) => dataset.kind === "leet" },
  {
    slot: "leetDerDatasetId",
    label: "LEET(der)",
    filter: (dataset) => dataset.kind === "leet-der",
  },
  { slot: "leipsDatasetId", label: "LEIPS", filter: (dataset) => dataset.kind === "leips" },
  { slot: "reelsDatasetId", label: "REELS", filter: (dataset) => dataset.kind === "reels" },
];

export type AnalysisTab = "data" | "sample" | "ups" | "leips" | "reels" | "band" | "fit";

export function bandIpSourceValue(source: AnalysisState["bandIpSource"]): string {
  if (!source) {
    return "dataset:";
  }
  if (source.mode === "dataset") {
    return `dataset:${source.datasetId ?? ""}`;
  }
  return source.mode;
}

export function defaultIpSourceForDisplay(
  analysis: AnalysisState,
): NonNullable<AnalysisState["bandIpSource"]> {
  const results = (analysis.ups?.ipResults ?? []).filter((result) => Number.isFinite(result.ip));
  const zeroVoltageResult = results.find((result) => Math.abs(result.appliedVoltage) < 1e-9);
  if (zeroVoltageResult) {
    return { mode: "dataset", datasetId: zeroVoltageResult.datasetId };
  }
  if (results.length >= 2) {
    return { mode: "zero-voltage-extrapolated" };
  }
  return { mode: "dataset", datasetId: results[0]?.datasetId };
}

export function zeroVoltageIp(analysis: AnalysisState): number | undefined {
  return calculateBiasDependence(
    (analysis.ups?.ipResults ?? []).map((result) => ({
      voltage: result.appliedVoltage,
      value: result.ip,
    })),
  )?.valueAtZero;
}

export function averageIp(analysis: AnalysisState): number | undefined {
  const values = (analysis.ups?.ipResults ?? [])
    .map((result) => result.ip)
    .filter((value) => Number.isFinite(value));
  if (values.length === 0) {
    return undefined;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
