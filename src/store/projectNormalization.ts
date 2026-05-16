import { DEFAULT_FIT_RANGES } from "../domain/demoData";
import { normalizeSampleInfo } from "../domain/sampleInfo";
import type { AnalysisState, SpectrumDataset, UPSIPFitRanges } from "../domain/types";
import { defaultWindows } from "./projectFactory";
import { defaultBandIpSource } from "./projectBandIpSource";
import { appliedVoltageForDataset, selectedUpsIpDatasetIds } from "./projectModelSelection";
import type { ProjectSnapshot } from "./projectTypes";

export function normalizeProject(project: ProjectSnapshot): ProjectSnapshot {
  const selection = normalizeSelection(project.analysis.selection);
  const upsIpConfigsByDatasetId = normalizeUpsIpConfigs(project);
  return {
    ...project,
    windows: normalizeWindows(project.windows),
    ui: {
      ...project.ui,
      reelsBackgroundMode: project.ui?.reelsBackgroundMode ?? "single-point",
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
      selection,
      upsIpFitRangesByDatasetId: normalizeUpsIpFitRanges(project),
      upsIpConfigsByDatasetId,
      bandIpSource:
        project.analysis.bandIpSource ??
        defaultBandIpSource({ ...project.analysis, selection, upsIpConfigsByDatasetId }),
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

function findDataset(
  datasets: readonly SpectrumDataset[],
  id?: string,
): SpectrumDataset | undefined {
  return datasets.find((dataset) => dataset.id === id);
}
