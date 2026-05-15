import { create } from "zustand";
import { CUSTOM_BANDPASS_TYPE } from "../domain/constants";
import type { SampleInfoField, SampleInfoFieldValue } from "../domain/sampleInfo";
import type { AnalysisState, FitRange, FitTarget, SpectrumDataset } from "../domain/types";
import {
  axisLabelForDatasetKind,
  autoFitRanges,
  autoSelectDatasets,
  defaultUpsIpRanges,
  fitRangeKey,
  isDemoDataset,
  mergeDatasets,
  normalizeProject,
  recalculateProject,
  selectedUpsIpDatasetIds,
  touchProject,
} from "./projectModel";
import { createDemoProject, createEmptyProject, defaultWindows } from "./projectFactory";
import {
  DEFAULT_CATALOG_ID,
  DEFAULT_CATALOG_NAME,
  createCatalogRecord,
  deleteCatalogRecord,
  deleteProject,
  ensureDefaultCatalog,
  exportCatalogGzip,
  findProjectByName,
  getCatalog,
  getCatalogProjectDb,
  importCatalogGzip,
  importProjectJson,
  listCatalogs,
  listProjects,
  loadProject,
  renameCatalogRecord,
  saveProject,
  touchCatalog,
} from "./projectDb";
import type {
  CatalogRecord,
  CursorStyle,
  PlotCursorStyleKey,
  ProjectRecord,
  ProjectSnapshot,
  ProjectUiState,
  WindowLayout,
} from "./projectTypes";
import { toggleUtilityWindow } from "./windowModel";
import type { LastOpenedWorkspaceRef } from "./lastOpenedWorkspace";

export { createInitialProject } from "./projectFactory";
export { fitRangeKey, resolvedBandpassEnergy } from "./projectModel";

interface ProjectStore {
  activeCatalog: CatalogRecord;
  project: ProjectSnapshot;
  isProjectUnsaved: boolean;
  activeFitTarget: FitTarget;
  newProject: () => void;
  loadDemo: () => void;
  addDatasets: (datasets: SpectrumDataset[]) => void;
  deleteDataset: (datasetId: string) => void;
  setDatasetKind: (datasetId: string, kind: SpectrumDataset["kind"]) => void;
  selectDataset: (datasetId: string) => void;
  assignDataset: (slot: keyof AnalysisState["selection"], datasetId: string) => void;
  assignUpsIpDatasets: (datasetIds: string[]) => void;
  setFitRange: (target: FitTarget, range: FitRange) => void;
  setUpsIpFitRange: (datasetId: string, target: FitTarget, range: FitRange) => void;
  setUpsIpAppliedVoltage: (datasetId: string, voltage: number) => void;
  setBandIpSource: (source: NonNullable<AnalysisState["bandIpSource"]>) => void;
  setBandpassType: (type: number) => void;
  setCustomBandpassEnergy: (energy: number) => void;
  setReelsIncidentEnergy: (energy: number) => void;
  setEfMinusEvbm: (value: number) => void;
  setActiveFitTarget: (target: FitTarget) => void;
  setBandDiagramViewport: (viewport: ProjectUiState["bandDiagramViewport"]) => void;
  setReelsPlotViewport: (viewport: ProjectUiState["reelsPlotViewport"]) => void;
  setUpsVbPlotViewport: (viewport: ProjectUiState["upsVbPlotViewport"]) => void;
  setUpsIpPlotViewport: (viewport: ProjectUiState["upsIpPlotViewport"]) => void;
  setUpsIpPlotViewportForDataset: (
    datasetId: string,
    viewport: ProjectUiState["upsIpPlotViewport"],
  ) => void;
  setActiveUpsIpDatasetId: (datasetId: string) => void;
  setLeipsPlotViewport: (viewport: ProjectUiState["leipsPlotViewport"]) => void;
  setLeipsEvacPlotViewport: (viewport: ProjectUiState["leipsEvacPlotViewport"]) => void;
  setReelsBackgroundMode: (mode: NonNullable<ProjectUiState["reelsBackgroundMode"]>) => void;
  setPlotCursorStyle: (plot: PlotCursorStyleKey, style: CursorStyle) => void;
  setSampleInfoField: (field: SampleInfoField, value: SampleInfoFieldValue) => void;
  updateWindow: (id: string, patch: Partial<WindowLayout>) => void;
  focusWindow: (id: string) => void;
  resetWindowPosition: (id: string) => void;
  resetWindowSize: (id: string) => void;
  resetAllWindowPositions: () => void;
  resetAllWindowSizes: () => void;
  toggleHelpWindow: () => void;
  toggleProjectsWindow: () => void;
  recalculate: () => void;
  saveCurrentProject: () => Promise<"saved" | "needs-name">;
  saveProjectAs: (name: string) => Promise<void>;
  renameCurrentProject: (name: string) => Promise<void>;
  deleteCurrentProject: () => Promise<void>;
  loadSavedProject: (id: string) => Promise<void>;
  listRecentProjects: () => Promise<ProjectRecord[]>;
  importProject: (json: string) => void;
  createCatalog: (name: string) => Promise<void>;
  switchCatalog: (id: string) => Promise<void>;
  renameCatalog: (id: string, name: string) => Promise<void>;
  deleteCatalog: (id: string) => Promise<void>;
  listCatalogs: () => Promise<CatalogRecord[]>;
  exportCatalog: (id: string) => Promise<Uint8Array>;
  importCatalog: (bytes: ArrayBuffer | Uint8Array) => Promise<CatalogRecord>;
  restoreLastOpenedWorkspace: (ref: LastOpenedWorkspaceRef) => Promise<void>;
  resetToDefaultEmptyWorkspace: () => Promise<void>;
}

const DEFAULT_CATALOG: CatalogRecord = {
  id: DEFAULT_CATALOG_ID,
  name: DEFAULT_CATALOG_NAME,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  lastOpenedAt: new Date(0).toISOString(),
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  activeCatalog: DEFAULT_CATALOG,
  project: createEmptyProject(),
  isProjectUnsaved: true,
  activeFitTarget: "ups-vb-edge",
  newProject: () => {
    set({ activeFitTarget: "ups-vb-edge", isProjectUnsaved: true, project: createEmptyProject() });
  },
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
          upsIpPlotViewportsByDatasetId: omitKeys(state.project.ui?.upsIpPlotViewportsByDatasetId, [
            datasetId,
          ]),
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
    set((state) => ({ project: touchProject({ ...state.project, selectedDatasetId: datasetId }) }));
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
          state.project.datasets.some((dataset) => dataset.id === id && dataset.kind === "ups-ip"),
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
  updateWindow: (id, patch) => {
    set((state) => ({
      project: touchProject({
        ...state.project,
        windows: state.project.windows.map((window) =>
          window.id === id ? { ...window, ...patch } : window,
        ),
      }),
    }));
  },
  focusWindow: (id) => {
    set((state) => {
      const nextZ = Math.max(...state.project.windows.map((window) => window.zIndex)) + 1;
      const target = state.project.windows.find((window) => window.id === id);
      if (!target || target.zIndex === nextZ - 1) {
        return state;
      }
      return {
        project: touchProject({
          ...state.project,
          windows: state.project.windows.map((window) =>
            window.id === id ? { ...window, zIndex: nextZ } : window,
          ),
        }),
      };
    });
  },
  resetWindowPosition: (id) => {
    set((state) => {
      const defaults = defaultWindows();
      return {
        project: touchProject({
          ...state.project,
          windows: state.project.windows.map((window) => {
            const defaultWindow = defaults.find((item) => item.id === window.id);
            return window.id === id && defaultWindow
              ? { ...window, x: defaultWindow.x, y: defaultWindow.y }
              : window;
          }),
        }),
      };
    });
  },
  resetWindowSize: (id) => {
    set((state) => {
      const defaults = defaultWindows();
      return {
        project: touchProject({
          ...state.project,
          windows: state.project.windows.map((window) => {
            const defaultWindow = defaults.find((item) => item.id === window.id);
            return window.id === id && defaultWindow
              ? { ...window, width: defaultWindow.width, height: defaultWindow.height }
              : window;
          }),
        }),
      };
    });
  },
  resetAllWindowPositions: () => {
    set((state) => {
      const defaults = defaultWindows();
      return {
        project: touchProject({
          ...state.project,
          windows: state.project.windows.map((window) => {
            const defaultWindow = defaults.find((item) => item.id === window.id);
            return defaultWindow ? { ...window, x: defaultWindow.x, y: defaultWindow.y } : window;
          }),
        }),
      };
    });
  },
  resetAllWindowSizes: () => {
    set((state) => {
      const defaults = defaultWindows();
      return {
        project: touchProject({
          ...state.project,
          windows: state.project.windows.map((window) => {
            const defaultWindow = defaults.find((item) => item.id === window.id);
            return defaultWindow
              ? { ...window, width: defaultWindow.width, height: defaultWindow.height }
              : window;
          }),
        }),
      };
    });
  },
  toggleHelpWindow: () => {
    set((state) => {
      const hasHelp = state.project.windows.some((window) => window.id === "help");
      if (hasHelp) {
        return {
          project: touchProject({
            ...state.project,
            windows: state.project.windows.filter((window) => window.id !== "help"),
          }),
        };
      }
      const nextZ = Math.max(...state.project.windows.map((window) => window.zIndex)) + 1;
      return {
        project: touchProject({
          ...state.project,
          windows: [
            ...state.project.windows,
            {
              id: "help",
              title: "Help",
              kind: "help",
              x: 1500,
              y: 796,
              width: 360,
              height: 320,
              zIndex: nextZ,
            },
          ],
        }),
      };
    });
  },
  toggleProjectsWindow: () => {
    set((state) =>
      toggleUtilityWindow(state.project, "projects", "Project List", 1120, 116, 520, 420),
    );
  },
  recalculate: () => {
    set((state) => ({ project: recalculateProject(touchProject(state.project)) }));
  },
  saveCurrentProject: async () => {
    const db = await activeProjectDb(get().activeCatalog.id);
    const existing = await loadProject(get().project.id, db);
    if (get().isProjectUnsaved || !existing) {
      return "needs-name";
    }
    await saveProject(get().project, db);
    return "saved";
  },
  saveProjectAs: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const db = await activeProjectDb(get().activeCatalog.id);
    const now = new Date().toISOString();
    const existing = await findProjectByName(trimmed, db);
    const project = touchProject({
      ...get().project,
      id: existing?.id ?? `project-${Date.now()}`,
      name: trimmed,
      createdAt: existing?.createdAt ?? now,
    });
    set({ isProjectUnsaved: false, project });
    await saveProject(project, db);
  },
  renameCurrentProject: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const db = await activeProjectDb(get().activeCatalog.id);
    const existing = await findProjectByName(trimmed, db);
    if (existing && existing.id !== get().project.id) {
      throw new Error("Project name already exists.");
    }
    const wasUnsaved = get().isProjectUnsaved;
    const wasSaved = await loadProject(get().project.id, db);
    const project = touchProject({ ...get().project, name: trimmed });
    set({ project });
    if (!wasUnsaved && wasSaved) {
      await saveProject(project, db);
    }
  },
  deleteCurrentProject: async () => {
    const db = await activeProjectDb(get().activeCatalog.id);
    await deleteProject(get().project.id, db);
    set({ activeFitTarget: "ups-vb-edge", isProjectUnsaved: true, project: createEmptyProject() });
  },
  loadSavedProject: async (id) => {
    const db = await activeProjectDb(get().activeCatalog.id);
    const project = await loadProject(id, db);
    if (project) {
      set({ isProjectUnsaved: false, project: recalculateProject(normalizeProject(project)) });
    }
  },
  listRecentProjects: async () => {
    const db = await activeProjectDb(get().activeCatalog.id);
    return listProjects(db);
  },
  importProject: (json) => {
    set({
      isProjectUnsaved: true,
      project: recalculateProject(normalizeProject(importProjectJson(json))),
    });
  },
  createCatalog: async (name) => {
    const catalog = await createCatalogRecord(name);
    set({
      activeCatalog: catalog,
      activeFitTarget: "ups-vb-edge",
      isProjectUnsaved: true,
      project: createEmptyProject(),
    });
  },
  switchCatalog: async (id) => {
    const catalog = await touchCatalog(id);
    if (!catalog) {
      return;
    }
    const project = await latestProjectForCatalog(catalog.id);
    set({
      activeCatalog: catalog,
      activeFitTarget: "ups-vb-edge",
      isProjectUnsaved: project ? false : true,
      project: project ? recalculateProject(normalizeProject(project)) : createEmptyProject(),
    });
  },
  renameCatalog: async (id, name) => {
    const catalog = await renameCatalogRecord(id, name);
    if (catalog && id === get().activeCatalog.id) {
      set({ activeCatalog: catalog });
    }
  },
  deleteCatalog: async (id) => {
    await deleteCatalogRecord(id);
    if (id !== get().activeCatalog.id) {
      return;
    }
    const catalogs = await listCatalogs();
    const nextCatalog = catalogs[0] ?? (await ensureDefaultCatalog());
    const project = await latestProjectForCatalog(nextCatalog.id);
    set({
      activeCatalog: nextCatalog,
      activeFitTarget: "ups-vb-edge",
      isProjectUnsaved: project ? false : true,
      project: project ? recalculateProject(normalizeProject(project)) : createEmptyProject(),
    });
  },
  listCatalogs: () => listCatalogs(),
  exportCatalog: (id) => exportCatalogGzip(id),
  importCatalog: async (bytes) => {
    const catalog = await importCatalogGzip(bytes);
    const project = await latestProjectForCatalog(catalog.id);
    set({
      activeCatalog: catalog,
      activeFitTarget: "ups-vb-edge",
      isProjectUnsaved: project ? false : true,
      project: project ? recalculateProject(normalizeProject(project)) : createEmptyProject(),
    });
    return catalog;
  },
  restoreLastOpenedWorkspace: async (ref) => {
    const catalog = await getCatalog(ref.catalogId);
    if (!catalog) {
      throw new Error("Last opened Catalog was not found.");
    }
    const db = await activeProjectDb(catalog.id);
    const project = ref.projectId ? await loadProject(ref.projectId, db) : undefined;
    if (ref.projectId && !project) {
      throw new Error("Last opened Project was not found.");
    }
    set({
      activeCatalog: catalog,
      activeFitTarget: "ups-vb-edge",
      isProjectUnsaved: project ? false : true,
      project: project ? recalculateProject(normalizeProject(project)) : createEmptyProject(),
    });
  },
  resetToDefaultEmptyWorkspace: async () => {
    const catalog = await ensureDefaultCatalog();
    set({
      activeCatalog: catalog,
      activeFitTarget: "ups-vb-edge",
      isProjectUnsaved: true,
      project: createEmptyProject(),
    });
  },
}));

async function activeProjectDb(catalogId: string) {
  await ensureDefaultCatalog();
  const catalog = await getCatalog(catalogId);
  return getCatalogProjectDb(catalog?.id ?? DEFAULT_CATALOG_ID);
}

async function latestProjectForCatalog(catalogId: string): Promise<ProjectSnapshot | undefined> {
  const db = await activeProjectDb(catalogId);
  const projects = await listProjects(db);
  if (projects.length === 0) {
    return undefined;
  }
  const { savedAt: _savedAt, ...project } = projects[0]!;
  return project;
}

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

function keepOnlyMatchingSelections(
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

function seedUpsIpFitRanges(
  current: AnalysisState["upsIpFitRangesByDatasetId"] | undefined,
  datasetIds: readonly string[],
): NonNullable<AnalysisState["upsIpFitRangesByDatasetId"]> {
  const next = { ...current };
  for (const datasetId of datasetIds) {
    next[datasetId] = next[datasetId] ?? defaultUpsIpRanges();
  }
  return next;
}

function seedUpsIpConfigs(
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

function omitKeys<T>(
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
