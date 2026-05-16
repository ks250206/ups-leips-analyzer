import {
  axisLabelForDatasetKind,
  autoFitRanges,
  autoSelectDatasets,
  isDemoDataset,
  mergeDatasets,
  recalculateProject,
  selectedUpsIpDatasetIds,
  touchProject,
} from "./projectModel";
import { createDemoProject } from "./projectFactory";
import type { ProjectStore } from "./projectStoreTypes";
import type { ProjectStoreGet, ProjectStoreSet } from "./projectStoreSliceTypes";
import {
  keepOnlyMatchingSelections,
  omitKeys,
  seedUpsIpConfigs,
  seedUpsIpFitRanges,
} from "./projectStoreHelpers";

type DatasetActions = Pick<
  ProjectStore,
  | "loadDemo"
  | "addDatasets"
  | "deleteDataset"
  | "setDatasetKind"
  | "selectDataset"
  | "assignDataset"
  | "assignUpsIpDatasets"
>;

export function createProjectStoreDatasetActions(
  set: ProjectStoreSet,
  _get: ProjectStoreGet,
): DatasetActions {
  return {
    loadDemo: () => {
      set({ isProjectUnsaved: true, project: createDemoProject() });
    },
    addDatasets: (datasets) => {
      set((state) => {
        const existing = state.project.datasets.filter((dataset) => !isDemoDataset(dataset));
        const merged = mergeDatasets(existing, datasets);
        const selection = autoSelectDatasets(merged, state.project.analysis.selection, datasets);
        const fitRanges = autoFitRanges(
          merged,
          selection,
          state.project.analysis.fitRanges,
          datasets,
          state.project.analysis.bandpassType,
          state.project.analysis.customBandpassEnergy,
          state.project.analysis.reelsIncidentEnergy,
        );
        const project = touchProject({
          ...state.project,
          datasets: merged,
          selectedDatasetId: datasets[0]?.id ?? state.project.selectedDatasetId,
          analysis: {
            ...state.project.analysis,
            fitRanges,
            selection,
            upsIpFitRangesByDatasetId: seedUpsIpFitRanges(
              state.project.analysis.upsIpFitRangesByDatasetId,
              selection.upsIpDatasetIds ?? [],
            ),
            upsIpConfigsByDatasetId: seedUpsIpConfigs(
              state.project.analysis.upsIpConfigsByDatasetId,
              merged,
              selection.upsIpDatasetIds ?? [],
            ),
          },
        });
        return { project: recalculateProject(project) };
      });
    },
    deleteDataset: (datasetId) => {
      set((state) => {
        const datasets = state.project.datasets.filter((dataset) => dataset.id !== datasetId);
        const selection = autoSelectDatasets(datasets, state.project.analysis.selection, []);
        const selectedDatasetId =
          state.project.selectedDatasetId === datasetId
            ? datasets[0]?.id
            : datasets.some((dataset) => dataset.id === state.project.selectedDatasetId)
              ? state.project.selectedDatasetId
              : datasets[0]?.id;
        const project = touchProject({
          ...state.project,
          datasets,
          selectedDatasetId,
          analysis: {
            ...state.project.analysis,
            selection,
            upsIpFitRangesByDatasetId: omitKeys(state.project.analysis.upsIpFitRangesByDatasetId, [
              datasetId,
            ]),
            upsIpConfigsByDatasetId: omitKeys(state.project.analysis.upsIpConfigsByDatasetId, [
              datasetId,
            ]),
          },
          ui: {
            ...state.project.ui,
            upsIpPlotViewportsByDatasetId: omitKeys(
              state.project.ui?.upsIpPlotViewportsByDatasetId,
              [datasetId],
            ),
            activeUpsIpDatasetId:
              state.project.ui?.activeUpsIpDatasetId === datasetId
                ? selection.upsIpDatasetIds?.[0]
                : state.project.ui?.activeUpsIpDatasetId,
          },
        });
        return { project: recalculateProject(project) };
      });
    },
    setDatasetKind: (datasetId, kind) => {
      set((state) => {
        let changed = false;
        const datasets = state.project.datasets.map((dataset) => {
          if (dataset.id !== datasetId) {
            return dataset;
          }
          changed = true;
          return {
            ...dataset,
            kind,
            xLabel: axisLabelForDatasetKind(kind),
          };
        });
        if (!changed) {
          return state;
        }
        const selection = keepOnlyMatchingSelections(datasets, state.project.analysis.selection);
        const fitRanges = autoFitRanges(
          datasets,
          selection,
          state.project.analysis.fitRanges,
          [],
          state.project.analysis.bandpassType,
          state.project.analysis.customBandpassEnergy,
          state.project.analysis.reelsIncidentEnergy,
        );
        const project = touchProject({
          ...state.project,
          datasets,
          analysis: {
            ...state.project.analysis,
            selection,
            fitRanges,
            upsIpFitRangesByDatasetId:
              kind === "ups-ip"
                ? state.project.analysis.upsIpFitRangesByDatasetId
                : omitKeys(state.project.analysis.upsIpFitRangesByDatasetId, [datasetId]),
            upsIpConfigsByDatasetId:
              kind === "ups-ip"
                ? state.project.analysis.upsIpConfigsByDatasetId
                : omitKeys(state.project.analysis.upsIpConfigsByDatasetId, [datasetId]),
          },
        });
        return { project: recalculateProject(project) };
      });
    },
    selectDataset: (datasetId) => {
      set((state) => ({
        project: touchProject({ ...state.project, selectedDatasetId: datasetId }),
      }));
    },
    assignDataset: (slot, datasetId) => {
      set((state) => {
        if (slot === "upsIpDatasetIds") {
          const current = new Set(selectedUpsIpDatasetIds(state.project.analysis.selection));
          if (current.has(datasetId)) {
            current.delete(datasetId);
          } else {
            current.add(datasetId);
          }
          const validIds = [...current].filter((id) =>
            state.project.datasets.some(
              (dataset) => dataset.id === id && dataset.kind === "ups-ip",
            ),
          );
          const selection = { ...state.project.analysis.selection, upsIpDatasetIds: validIds };
          const project = touchProject({
            ...state.project,
            analysis: {
              ...state.project.analysis,
              selection,
              upsIpFitRangesByDatasetId: seedUpsIpFitRanges(
                state.project.analysis.upsIpFitRangesByDatasetId,
                validIds,
              ),
              upsIpConfigsByDatasetId: seedUpsIpConfigs(
                state.project.analysis.upsIpConfigsByDatasetId,
                state.project.datasets,
                validIds,
              ),
            },
          });
          return { project: recalculateProject(project) };
        }
        const selection = { ...state.project.analysis.selection, [slot]: datasetId };
        const fitRanges = autoFitRanges(
          state.project.datasets,
          selection,
          state.project.analysis.fitRanges,
          [],
          state.project.analysis.bandpassType,
          state.project.analysis.customBandpassEnergy,
          state.project.analysis.reelsIncidentEnergy,
        );
        const project = touchProject({
          ...state.project,
          analysis: {
            ...state.project.analysis,
            fitRanges,
            selection,
          },
        });
        return { project: recalculateProject(project) };
      });
    },
    assignUpsIpDatasets: (datasetIds) => {
      set((state) => {
        const validIds = datasetIds.filter((datasetId) =>
          state.project.datasets.some(
            (dataset) => dataset.id === datasetId && dataset.kind === "ups-ip",
          ),
        );
        const selection = { ...state.project.analysis.selection, upsIpDatasetIds: validIds };
        const project = touchProject({
          ...state.project,
          analysis: {
            ...state.project.analysis,
            selection,
            upsIpFitRangesByDatasetId: seedUpsIpFitRanges(
              state.project.analysis.upsIpFitRangesByDatasetId,
              validIds,
            ),
            upsIpConfigsByDatasetId: seedUpsIpConfigs(
              state.project.analysis.upsIpConfigsByDatasetId,
              state.project.datasets,
              validIds,
            ),
          },
          ui: {
            ...state.project.ui,
            activeUpsIpDatasetId:
              state.project.ui?.activeUpsIpDatasetId &&
              validIds.includes(state.project.ui.activeUpsIpDatasetId)
                ? state.project.ui.activeUpsIpDatasetId
                : validIds[0],
          },
        });
        return { project: recalculateProject(project) };
      });
    },
  };
}
