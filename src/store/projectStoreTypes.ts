import type { SampleInfoField, SampleInfoFieldValue } from "../domain/sampleInfo";
import type { AnalysisState, FitRange, FitTarget, SpectrumDataset } from "../domain/types";
import type { LastOpenedWorkspaceRef } from "./lastOpenedWorkspace";
import type {
  CatalogRecord,
  CursorStyle,
  PlotCursorStyleKey,
  ProjectRecord,
  ProjectSnapshot,
  ProjectUiState,
  WindowLayout,
} from "./projectTypes";

export interface ProjectStore {
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
  setUpsBiasPlotViewport: (
    plot: "ecutoff" | "evbm" | "ip",
    viewport: NonNullable<ProjectUiState["upsBiasPlotViewports"]>["ecutoff"],
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
