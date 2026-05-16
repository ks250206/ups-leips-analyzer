import { create } from "zustand";
import { createEmptyProject } from "./projectFactory";
import { createProjectStoreAnalysisActions } from "./projectStoreAnalysisActions";
import { createProjectStoreDatasetActions } from "./projectStoreDatasetActions";
import {
  DEFAULT_CATALOG,
  createProjectStoreLifecycleActions,
} from "./projectStoreLifecycleActions";
import { createProjectStoreUiActions } from "./projectStoreUiActions";
import { createProjectStoreWindowActions } from "./projectStoreWindowActions";
import type { ProjectStore } from "./projectStoreTypes";

export { createInitialProject } from "./projectFactory";
export { fitRangeKey, resolvedBandpassEnergy } from "./projectModel";

export const useProjectStore = create<ProjectStore>((set, get) => ({
  activeCatalog: DEFAULT_CATALOG,
  project: createEmptyProject(),
  isProjectUnsaved: true,
  activeFitTarget: "ups-vb-edge",
  ...createProjectStoreLifecycleActions(set, get),
  ...createProjectStoreDatasetActions(set, get),
  ...createProjectStoreAnalysisActions(set, get),
  ...createProjectStoreUiActions(set, get),
  ...createProjectStoreWindowActions(set, get),
}));
