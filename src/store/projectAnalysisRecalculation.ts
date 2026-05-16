import {
  calculateLEIPSResult,
  calculateREELSResult,
  assembleUPSResult,
  calculateUPSIPResult,
  createBandDiagram,
} from "../domain/analysis";
import { lineIntersection, linearFit } from "../domain/fit";
import type { FitRange, SpectrumDataset, UPSIPResult } from "../domain/types";
import { resolveBandIp } from "./projectBandIpSource";
import { resolvedBandpassEnergy } from "./projectFitRanges";
import {
  appliedVoltageForDataset,
  selectedUpsIpDatasetIds,
  upsIpRangesForDataset,
} from "./projectModelSelection";
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
          backgroundMode: project.ui?.reelsBackgroundMode ?? "single-point",
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

function findDataset(
  datasets: readonly SpectrumDataset[],
  id?: string,
): SpectrumDataset | undefined {
  return datasets.find((dataset) => dataset.id === id);
}
