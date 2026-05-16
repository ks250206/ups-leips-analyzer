import { touchProject } from "./projectModel";
import type { ProjectStore } from "./projectStoreTypes";
import type { ProjectStoreGet, ProjectStoreSet } from "./projectStoreSliceTypes";

type UiActions = Pick<
  ProjectStore,
  | "setBandDiagramViewport"
  | "setReelsPlotViewport"
  | "setUpsVbPlotViewport"
  | "setUpsIpPlotViewport"
  | "setUpsIpPlotViewportForDataset"
  | "setUpsBiasPlotViewport"
  | "setActiveUpsIpDatasetId"
  | "setLeipsPlotViewport"
  | "setLeipsEvacPlotViewport"
  | "setReelsBackgroundMode"
  | "setPlotCursorStyle"
  | "setSampleInfoField"
>;

export function createProjectStoreUiActions(
  set: ProjectStoreSet,
  _get: ProjectStoreGet,
): UiActions {
  return {
    setBandDiagramViewport: (viewport) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: { ...state.project.ui, bandDiagramViewport: viewport },
        }),
      }));
    },
    setReelsPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: { ...state.project.ui, reelsPlotViewport: viewport },
        }),
      }));
    },
    setUpsVbPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: { ...state.project.ui, upsVbPlotViewport: viewport },
        }),
      }));
    },
    setUpsIpPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: { ...state.project.ui, upsIpPlotViewport: viewport },
        }),
      }));
    },
    setUpsIpPlotViewportForDataset: (datasetId, viewport) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: {
            ...state.project.ui,
            upsIpPlotViewportsByDatasetId: {
              ...state.project.ui?.upsIpPlotViewportsByDatasetId,
              ...(viewport ? { [datasetId]: viewport } : {}),
            },
          },
        }),
      }));
    },
    setUpsBiasPlotViewport: (plot, viewport) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: {
            ...state.project.ui,
            upsBiasPlotViewports: {
              ...state.project.ui?.upsBiasPlotViewports,
              [plot]: viewport,
            },
          },
        }),
      }));
    },
    setActiveUpsIpDatasetId: (datasetId) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: { ...state.project.ui, activeUpsIpDatasetId: datasetId },
        }),
      }));
    },
    setLeipsPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: { ...state.project.ui, leipsPlotViewport: viewport },
        }),
      }));
    },
    setLeipsEvacPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: { ...state.project.ui, leipsEvacPlotViewport: viewport },
        }),
      }));
    },
    setReelsBackgroundMode: (mode) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: { ...state.project.ui, reelsBackgroundMode: mode },
        }),
      }));
    },
    setPlotCursorStyle: (plot, style) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: {
            ...state.project.ui,
            cursorStyles: { ...state.project.ui?.cursorStyles, [plot]: style },
          },
        }),
      }));
    },
    setSampleInfoField: (field, value) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          ui: {
            ...state.project.ui,
            sampleInfo: { ...state.project.ui?.sampleInfo, [field]: value },
          },
        }),
      }));
    },
  };
}
