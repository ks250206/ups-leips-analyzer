import type { AnalysisState, FitTarget } from "../domain/types";
import type { ProjectSnapshot } from "./projectTypes";

export { recalculateProject } from "./projectAnalysisRecalculation";
export { axisLabelForDatasetKind } from "./projectAxisLabels";
export { defaultBandIpSource, resolveBandIp } from "./projectBandIpSource";
export { autoFitRanges, resolvedBandpassEnergy } from "./projectFitRanges";
export { normalizeProject } from "./projectNormalization";
export {
  appliedVoltageForDataset,
  autoSelectDatasets,
  defaultUpsIpRanges,
  isDemoDataset,
  mergeDatasets,
  selectedUpsIpDatasetIds,
  upsIpRangesForDataset,
} from "./projectModelSelection";

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

export function touchProject(project: ProjectSnapshot): ProjectSnapshot {
  return { ...project, updatedAt: new Date().toISOString() };
}
