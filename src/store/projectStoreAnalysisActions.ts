import { CUSTOM_BANDPASS_TYPE } from "../domain/constants";
import {
  autoFitRanges,
  defaultUpsIpRanges,
  fitRangeKey,
  recalculateProject,
  touchProject,
} from "./projectModel";
import type { ProjectStore } from "./projectStoreTypes";
import type { ProjectStoreGet, ProjectStoreSet } from "./projectStoreSliceTypes";

type AnalysisActions = Pick<
  ProjectStore,
  | "setFitRange"
  | "setUpsIpFitRange"
  | "setUpsIpAppliedVoltage"
  | "setBandIpSource"
  | "setBandpassType"
  | "setCustomBandpassEnergy"
  | "setReelsIncidentEnergy"
  | "setEfMinusEvbm"
  | "setActiveFitTarget"
  | "recalculate"
>;

export function createProjectStoreAnalysisActions(
  set: ProjectStoreSet,
  _get: ProjectStoreGet,
): AnalysisActions {
  return {
    setFitRange: (target, range) => {
      set((state) => {
        const fitRanges = { ...state.project.analysis.fitRanges };
        fitRanges[fitRangeKey(target)] = range;
        const project = touchProject({
          ...state.project,
          analysis: { ...state.project.analysis, fitRanges },
        });
        return { activeFitTarget: target, project: recalculateProject(project) };
      });
    },
    setUpsIpFitRange: (datasetId, target, range) => {
      set((state) => {
        const current =
          state.project.analysis.upsIpFitRangesByDatasetId?.[datasetId] ?? defaultUpsIpRanges();
        const next = { ...current };
        switch (target) {
          case "ups-ip-vbm-edge":
            next.ipVbmEdge = range;
            break;
          case "ups-ip-vbm-bg":
            next.ipVbmBackground = range;
            break;
          case "ups-ip-edge":
            next.cutoffEdge = range;
            break;
          case "ups-ip-bg":
            next.cutoffBackground = range;
            break;
          default:
            return state;
        }
        const project = touchProject({
          ...state.project,
          analysis: {
            ...state.project.analysis,
            upsIpFitRangesByDatasetId: {
              ...state.project.analysis.upsIpFitRangesByDatasetId,
              [datasetId]: next,
            },
          },
        });
        return { activeFitTarget: target, project: recalculateProject(project) };
      });
    },
    setUpsIpAppliedVoltage: (datasetId, voltage) => {
      set((state) => {
        if (!Number.isFinite(voltage)) {
          return state;
        }
        const project = touchProject({
          ...state.project,
          analysis: {
            ...state.project.analysis,
            upsIpConfigsByDatasetId: {
              ...state.project.analysis.upsIpConfigsByDatasetId,
              [datasetId]: { appliedVoltage: voltage },
            },
          },
        });
        return { project: recalculateProject(project) };
      });
    },
    setBandIpSource: (source) => {
      set((state) => {
        const project = touchProject({
          ...state.project,
          analysis: { ...state.project.analysis, bandIpSource: source },
        });
        return { project: recalculateProject(project) };
      });
    },
    setBandpassType: (type) => {
      set((state) => {
        const fitRanges = autoFitRanges(
          state.project.datasets,
          state.project.analysis.selection,
          state.project.analysis.fitRanges,
          [],
          type,
          state.project.analysis.customBandpassEnergy,
          state.project.analysis.reelsIncidentEnergy,
        );
        const project = touchProject({
          ...state.project,
          analysis: { ...state.project.analysis, bandpassType: type, fitRanges },
        });
        return { project: recalculateProject(project) };
      });
    },
    setCustomBandpassEnergy: (energy) => {
      set((state) => {
        const customBandpassEnergy = Number.isFinite(energy) ? energy : 0;
        const fitRanges = autoFitRanges(
          state.project.datasets,
          state.project.analysis.selection,
          state.project.analysis.fitRanges,
          [],
          CUSTOM_BANDPASS_TYPE,
          customBandpassEnergy,
          state.project.analysis.reelsIncidentEnergy,
        );
        const project = touchProject({
          ...state.project,
          analysis: {
            ...state.project.analysis,
            bandpassType: CUSTOM_BANDPASS_TYPE,
            customBandpassEnergy,
            fitRanges,
          },
        });
        return { project: recalculateProject(project) };
      });
    },
    setReelsIncidentEnergy: (energy) => {
      set((state) => {
        const reelsIncidentEnergy = Number.isFinite(energy) ? energy : 1000;
        const fitRanges = autoFitRanges(
          state.project.datasets,
          state.project.analysis.selection,
          state.project.analysis.fitRanges,
          [],
          state.project.analysis.bandpassType,
          state.project.analysis.customBandpassEnergy,
          reelsIncidentEnergy,
        );
        const project = touchProject({
          ...state.project,
          analysis: { ...state.project.analysis, reelsIncidentEnergy, fitRanges },
        });
        return { project: recalculateProject(project) };
      });
    },
    setEfMinusEvbm: (value) => {
      set((state) => {
        const project = touchProject({
          ...state.project,
          analysis: { ...state.project.analysis, efMinusEvbm: value },
        });
        return { project: recalculateProject(project) };
      });
    },
    setActiveFitTarget: (target) => {
      set({ activeFitTarget: target });
    },
    recalculate: () => {
      set((state) => ({ project: recalculateProject(touchProject(state.project)) }));
    },
  };
}
