import { create } from "zustand";
import { calculateLEIPSResult, calculateUPSResult, createBandDiagram } from "../domain/analysis";
import { createDemoDatasets, createInitialAnalysis, DEFAULT_FIT_RANGES } from "../domain/demoData";
import type { AnalysisState, FitRange, FitTarget, SpectrumDataset } from "../domain/types";
import { importProjectJson, saveProject } from "./projectDb";
import type { ProjectSnapshot, WindowLayout } from "./projectTypes";

interface ProjectStore {
  project: ProjectSnapshot;
  activeFitTarget: FitTarget;
  loadDemo: () => void;
  addDatasets: (datasets: SpectrumDataset[]) => void;
  selectDataset: (datasetId: string) => void;
  assignDataset: (slot: keyof AnalysisState["selection"], datasetId: string) => void;
  setFitRange: (target: FitTarget, range: FitRange) => void;
  setBandpassType: (type: number) => void;
  setEfMinusEvbm: (value: number) => void;
  setActiveFitTarget: (target: FitTarget) => void;
  updateWindow: (id: string, patch: Partial<WindowLayout>) => void;
  focusWindow: (id: string) => void;
  recalculate: () => void;
  saveCurrentProject: () => Promise<void>;
  importProject: (json: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createInitialProject(),
  activeFitTarget: "ups-vb-edge",
  loadDemo: () => {
    set({ project: createInitialProject() });
  },
  addDatasets: (datasets) => {
    set((state) => {
      const existing = state.project.datasets.filter((dataset) => !isDemoDataset(dataset));
      const merged = mergeDatasets(existing, datasets);
      const selection = autoSelectDatasets(merged, state.project.analysis.selection, datasets);
      const project = touchProject({
        ...state.project,
        datasets: merged,
        selectedDatasetId: datasets[0]?.id ?? state.project.selectedDatasetId,
        analysis: { ...state.project.analysis, selection },
      });
      return { project: recalculateProject(project) };
    });
  },
  selectDataset: (datasetId) => {
    set((state) => ({ project: touchProject({ ...state.project, selectedDatasetId: datasetId }) }));
  },
  assignDataset: (slot, datasetId) => {
    set((state) => {
      const project = touchProject({
        ...state.project,
        analysis: {
          ...state.project.analysis,
          selection: { ...state.project.analysis.selection, [slot]: datasetId },
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
      const project = touchProject({
        ...state.project,
        analysis: { ...state.project.analysis, bandpassType: type },
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
  recalculate: () => {
    set((state) => ({ project: recalculateProject(touchProject(state.project)) }));
  },
  saveCurrentProject: async () => {
    await saveProject(get().project);
  },
  importProject: (json) => {
    set({ project: recalculateProject(normalizeProject(importProjectJson(json))) });
  },
}));

export function createInitialProject(): ProjectSnapshot {
  const datasets = createDemoDatasets();
  const now = new Date().toISOString();
  return {
    id: "default-project",
    name: "UPS-LEIPS Demo",
    datasets,
    selectedDatasetId: datasets[0]?.id,
    analysis: createInitialAnalysis(datasets),
    windows: defaultWindows(),
    createdAt: now,
    updatedAt: now,
  };
}

export function recalculateProject(project: ProjectSnapshot): ProjectSnapshot {
  const analysis = project.analysis;
  const vbDataset = findDataset(project.datasets, analysis.selection.upsVbDatasetId);
  const ipDataset = findDataset(project.datasets, analysis.selection.upsIpDatasetId);
  const leetDerDataset = findDataset(project.datasets, analysis.selection.leetDerDatasetId);
  const leipsDataset = findDataset(project.datasets, analysis.selection.leipsDatasetId);

  try {
    const ups =
      vbDataset && ipDataset
        ? calculateUPSResult({
            vbDataset,
            ipDataset,
            vbEdgeRange: analysis.fitRanges.upsVbEdge,
            vbBackgroundRange: analysis.fitRanges.upsVbBackground,
            ipVbmEdgeRange: analysis.fitRanges.upsIpVbmEdge,
            ipVbmBackgroundRange: analysis.fitRanges.upsIpVbmBackground,
            cutoffEdgeRange: analysis.fitRanges.upsIpEdge,
            cutoffBackgroundRange: analysis.fitRanges.upsIpBackground,
            photonEnergy: analysis.photonEnergy,
          })
        : undefined;
    const leips =
      leetDerDataset && leipsDataset
        ? calculateLEIPSResult({
            leetDerDataset,
            leipsDataset,
            peakRange: analysis.fitRanges.leetDerPeak,
            edgeRange: analysis.fitRanges.leipsEdge,
            backgroundRange: analysis.fitRanges.leipsBackground,
            bandpassType: analysis.bandpassType,
          })
        : undefined;
    const efMinusEvbm = ups
      ? ups.efMinusEvbm
      : Number.isFinite(analysis.efMinusEvbm)
        ? analysis.efMinusEvbm
        : 0;
    const band =
      ups && leips && vbDataset
        ? createBandDiagram({
            vbDataset,
            leipsEvacPoints: leips.leipsEvacPoints,
            efMinusEvbm,
            ip: ups.ip,
            ea: leips.ea,
          })
        : undefined;

    return {
      ...project,
      analysis: { ...analysis, efMinusEvbm, ups, leips, band, error: undefined },
    };
  } catch (error) {
    return {
      ...project,
      analysis: { ...analysis, error: error instanceof Error ? error.message : String(error) },
    };
  }
}

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
  }
}

function normalizeProject(project: ProjectSnapshot): ProjectSnapshot {
  return {
    ...project,
    analysis: {
      ...project.analysis,
      fitRanges: {
        ...DEFAULT_FIT_RANGES,
        ...project.analysis.fitRanges,
      },
    },
  };
}

function mergeDatasets(
  existing: readonly SpectrumDataset[],
  incoming: readonly SpectrumDataset[],
): SpectrumDataset[] {
  const byId = new Map(existing.map((dataset) => [dataset.id, dataset]));
  for (const dataset of incoming) {
    byId.set(dataset.id, dataset);
  }
  return [...byId.values()];
}

function isDemoDataset(dataset: SpectrumDataset): boolean {
  return dataset.metadata.fixture === "synthetic";
}

function autoSelectDatasets(
  datasets: readonly SpectrumDataset[],
  current: AnalysisState["selection"],
  preferred: readonly SpectrumDataset[] = [],
): AnalysisState["selection"] {
  return {
    upsVbDatasetId: pickDatasetId("ups-vb", datasets, current.upsVbDatasetId, preferred),
    upsIpDatasetId: pickDatasetId("ups-ip", datasets, current.upsIpDatasetId, preferred),
    leetDatasetId: pickDatasetId("leet", datasets, current.leetDatasetId, preferred),
    leetDerDatasetId: pickDatasetId("leet-der", datasets, current.leetDerDatasetId, preferred),
    leipsDatasetId: pickDatasetId("leips", datasets, current.leipsDatasetId, preferred),
  };
}

function pickDatasetId(
  kind: SpectrumDataset["kind"],
  datasets: readonly SpectrumDataset[],
  currentId: string | undefined,
  preferred: readonly SpectrumDataset[],
): string | undefined {
  return (
    preferred.find((dataset) => dataset.kind === kind)?.id ??
    currentId ??
    datasets.find((dataset) => dataset.kind === kind)?.id
  );
}

function findDataset(
  datasets: readonly SpectrumDataset[],
  id?: string,
): SpectrumDataset | undefined {
  return datasets.find((dataset) => dataset.id === id);
}

function touchProject(project: ProjectSnapshot): ProjectSnapshot {
  return { ...project, updatedAt: new Date().toISOString() };
}

function defaultWindows(): WindowLayout[] {
  return [
    {
      id: "browser",
      title: "Data Browser",
      kind: "browser",
      x: 18,
      y: 52,
      width: 280,
      height: 620,
      zIndex: 5,
    },
    {
      id: "controls",
      title: "UPS_analysis",
      kind: "controls",
      x: 1450,
      y: 52,
      width: 420,
      height: 760,
      zIndex: 9,
    },
    {
      id: "table",
      title: "Table",
      kind: "table",
      x: 318,
      y: 52,
      width: 360,
      height: 310,
      zIndex: 4,
    },
    {
      id: "ups-vb",
      title: "UPS VB",
      kind: "ups-vb",
      x: 696,
      y: 52,
      width: 330,
      height: 310,
      zIndex: 6,
    },
    {
      id: "ups-ip",
      title: "UPS IP",
      kind: "ups-ip",
      x: 1044,
      y: 52,
      width: 360,
      height: 310,
      zIndex: 7,
    },
    {
      id: "leips",
      title: "LEIPS Plot",
      kind: "leips",
      x: 318,
      y: 384,
      width: 470,
      height: 320,
      zIndex: 8,
    },
    {
      id: "leips-evac",
      title: "LEIPS vs Energy from Evac.",
      kind: "leips-evac",
      x: 808,
      y: 384,
      width: 600,
      height: 320,
      zIndex: 9,
    },
    {
      id: "band",
      title: "UPS-LEIPS Band Diagram",
      kind: "band",
      x: 808,
      y: 720,
      width: 600,
      height: 300,
      zIndex: 10,
    },
  ];
}
