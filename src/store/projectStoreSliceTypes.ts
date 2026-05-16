import type { ProjectStore } from "./projectStoreTypes";

export type ProjectStoreSet = (
  partial:
    | ProjectStore
    | Partial<ProjectStore>
    | ((state: ProjectStore) => ProjectStore | Partial<ProjectStore>),
) => void;

export type ProjectStoreGet = () => ProjectStore;
