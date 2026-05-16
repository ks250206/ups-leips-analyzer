import { calculateBiasDependence } from "../domain/analysis";
import type { AnalysisState, BandIpSource, UPSIPResult } from "../domain/types";
import { selectedUpsIpDatasetIds } from "./projectModelSelection";

export function defaultBandIpSource(analysis: AnalysisState): BandIpSource {
  const selectedIds = selectedUpsIpDatasetIds(analysis.selection);
  const zeroVoltageDatasetId = selectedIds.find((id) => {
    const voltage = analysis.upsIpConfigsByDatasetId?.[id]?.appliedVoltage;
    return voltage !== undefined && Math.abs(voltage) < 1e-9;
  });
  if (zeroVoltageDatasetId) {
    return { mode: "dataset", datasetId: zeroVoltageDatasetId };
  }
  if (selectedIds.length >= 2) {
    return { mode: "zero-voltage-extrapolated" };
  }
  return { mode: "dataset", datasetId: selectedIds[0] };
}

export function resolveBandIp(
  ipResults: readonly UPSIPResult[],
  source: BandIpSource | undefined,
): number {
  const finiteResults = ipResults.filter((result) => Number.isFinite(result.ip));
  const resolvedSource = source ?? defaultBandIpSourceFromResults(finiteResults);
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

function defaultBandIpSourceFromResults(ipResults: readonly UPSIPResult[]): BandIpSource {
  const zeroVoltageResult = ipResults.find((result) => Math.abs(result.appliedVoltage) < 1e-9);
  if (zeroVoltageResult) {
    return { mode: "dataset", datasetId: zeroVoltageResult.datasetId };
  }
  if (ipResults.length >= 2) {
    return { mode: "zero-voltage-extrapolated" };
  }
  return { mode: "dataset", datasetId: ipResults[0]?.datasetId };
}

function average(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) {
    return Number.NaN;
  }
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}
