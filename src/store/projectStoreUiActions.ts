import type { ProjectStore } from "./projectStoreTypes";
import type { ProjectStoreGet, ProjectStoreSet } from "./projectStoreSliceTypes";
import { touchProjectUi } from "./projectStoreUpdateHelpers";

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
        project: touchProjectUi(state.project, { bandDiagramViewport: viewport }),
      }));
    },
    setReelsPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProjectUi(state.project, { reelsPlotViewport: viewport }),
      }));
    },
    setUpsVbPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProjectUi(state.project, { upsVbPlotViewport: viewport }),
      }));
    },
    setUpsIpPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProjectUi(state.project, { upsIpPlotViewport: viewport }),
      }));
    },
    setUpsIpPlotViewportForDataset: (datasetId, viewport) => {
      set((state) => ({
        project: touchProjectUi(state.project, {
          upsIpPlotViewportsByDatasetId: {
            ...state.project.ui?.upsIpPlotViewportsByDatasetId,
            ...(viewport ? { [datasetId]: viewport } : {}),
          },
        }),
      }));
    },
    setUpsBiasPlotViewport: (plot, viewport) => {
      set((state) => ({
        project: touchProjectUi(state.project, {
          upsBiasPlotViewports: {
            ...state.project.ui?.upsBiasPlotViewports,
            [plot]: viewport,
          },
        }),
      }));
    },
    setActiveUpsIpDatasetId: (datasetId) => {
      set((state) => ({
        project: touchProjectUi(state.project, { activeUpsIpDatasetId: datasetId }),
      }));
    },
    setLeipsPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProjectUi(state.project, { leipsPlotViewport: viewport }),
      }));
    },
    setLeipsEvacPlotViewport: (viewport) => {
      set((state) => ({
        project: touchProjectUi(state.project, { leipsEvacPlotViewport: viewport }),
      }));
    },
    setReelsBackgroundMode: (mode) => {
      set((state) => ({
        project: touchProjectUi(state.project, { reelsBackgroundMode: mode }),
      }));
    },
    setPlotCursorStyle: (plot, style) => {
      set((state) => ({
        project: touchProjectUi(state.project, {
          cursorStyles: { ...state.project.ui?.cursorStyles, [plot]: style },
        }),
      }));
    },
    setSampleInfoField: (field, value) => {
      set((state) => ({
        project: touchProjectUi(state.project, {
          sampleInfo: { ...state.project.ui?.sampleInfo, [field]: value },
        }),
      }));
    },
  };
}
