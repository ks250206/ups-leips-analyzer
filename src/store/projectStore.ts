import { create } from "zustand";
import { CUSTOM_BANDPASS_TYPE } from "../domain/constants";
import type { AnalysisState, FitRange, FitTarget, SpectrumDataset } from "../domain/types";
import {
  autoFitRanges,
  autoSelectDatasets,
  fitRangeKey,
  isDemoDataset,
  mergeDatasets,
  normalizeProject,
  recalculateProject,
  touchProject,
} from "./projectModel";
import { createDemoProject, createEmptyProject, defaultWindows } from "./projectFactory";
import {
  deleteProject,
  findProjectByName,
  importProjectJson,
  listProjects,
  loadProject,
  saveProject,
} from "./projectDb";
import type { ProjectRecord, ProjectSnapshot, ProjectUiState, WindowLayout } from "./projectTypes";
import { toggleUtilityWindow } from "./windowModel";

export { createInitialProject } from "./projectFactory";
export { fitRangeKey, resolvedBandpassEnergy } from "./projectModel";

interface ProjectStore {
  project: ProjectSnapshot;
  activeFitTarget: FitTarget;
  newProject: () => void;
  loadDemo: () => void;
  addDatasets: (datasets: SpectrumDataset[]) => void;
  selectDataset: (datasetId: string) => void;
  assignDataset: (slot: keyof AnalysisState["selection"], datasetId: string) => void;
  setFitRange: (target: FitTarget, range: FitRange) => void;
  setBandpassType: (type: number) => void;
  setCustomBandpassEnergy: (energy: number) => void;
  setEfMinusEvbm: (value: number) => void;
  setActiveFitTarget: (target: FitTarget) => void;
  setBandDiagramViewport: (viewport: ProjectUiState["bandDiagramViewport"]) => void;
  updateWindow: (id: string, patch: Partial<WindowLayout>) => void;
  focusWindow: (id: string) => void;
  resetWindowPosition: (id: string) => void;
  resetWindowSize: (id: string) => void;
  resetAllWindowPositions: () => void;
  resetAllWindowSizes: () => void;
  toggleHelpWindow: () => void;
  toggleProjectsWindow: () => void;
  recalculate: () => void;
  saveCurrentProject: () => Promise<void>;
  saveProjectAs: (name: string) => Promise<void>;
  deleteCurrentProject: () => Promise<void>;
  loadSavedProject: (id: string) => Promise<void>;
  listRecentProjects: () => Promise<ProjectRecord[]>;
  importProject: (json: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createEmptyProject(),
  activeFitTarget: "ups-vb-edge",
  newProject: () => {
    set({ activeFitTarget: "ups-vb-edge", project: createEmptyProject() });
  },
  loadDemo: () => {
    set({ project: createDemoProject() });
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
      );
      const project = touchProject({
        ...state.project,
        datasets: merged,
        selectedDatasetId: datasets[0]?.id ?? state.project.selectedDatasetId,
        analysis: { ...state.project.analysis, fitRanges, selection },
      });
      return { project: recalculateProject(project) };
    });
  },
  selectDataset: (datasetId) => {
    set((state) => ({ project: touchProject({ ...state.project, selectedDatasetId: datasetId }) }));
  },
  assignDataset: (slot, datasetId) => {
    set((state) => {
      const selection = { ...state.project.analysis.selection, [slot]: datasetId };
      const fitRanges = autoFitRanges(
        state.project.datasets,
        selection,
        state.project.analysis.fitRanges,
        [],
        state.project.analysis.bandpassType,
        state.project.analysis.customBandpassEnergy,
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
  setBandpassType: (type) => {
    set((state) => {
      const fitRanges = autoFitRanges(
        state.project.datasets,
        state.project.analysis.selection,
        state.project.analysis.fitRanges,
        [],
        type,
        state.project.analysis.customBandpassEnergy,
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
              y: 120,
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
    await saveProject(get().project);
  },
  saveProjectAs: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const now = new Date().toISOString();
    const existing = await findProjectByName(trimmed);
    const project = touchProject({
      ...get().project,
      id: existing?.id ?? `project-${Date.now()}`,
      name: trimmed,
      createdAt: existing?.createdAt ?? now,
    });
    set({ project });
    await saveProject(project);
  },
  deleteCurrentProject: async () => {
    await deleteProject(get().project.id);
    set({ activeFitTarget: "ups-vb-edge", project: createEmptyProject() });
  },
  loadSavedProject: async (id) => {
    const project = await loadProject(id);
    if (project) {
      set({ project: recalculateProject(normalizeProject(project)) });
    }
  },
  listRecentProjects: () => listProjects(),
  importProject: (json) => {
    set({ project: recalculateProject(normalizeProject(importProjectJson(json))) });
  },
}));
