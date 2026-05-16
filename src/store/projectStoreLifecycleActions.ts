import {
  createCatalogRecord,
  deleteCatalogRecord,
  deleteProject,
  ensureDefaultCatalog,
  exportCatalogGzip,
  findProjectByName,
  getCatalog,
  importCatalogGzip,
  importProjectJson,
  listCatalogs,
  listProjects,
  loadProject,
  renameCatalogRecord,
  saveProject,
  touchCatalog,
} from "./projectDb";
import { createEmptyProject } from "./projectFactory";
import { normalizeProject, recalculateProject, touchProject } from "./projectModel";
import type { ProjectStore } from "./projectStoreTypes";
import { activeProjectDb, latestProjectForCatalog } from "./projectStoreLifecycleHelpers";
import type { ProjectStoreGet, ProjectStoreSet } from "./projectStoreSliceTypes";

type LifecycleActions = Pick<
  ProjectStore,
  | "newProject"
  | "saveCurrentProject"
  | "saveProjectAs"
  | "renameCurrentProject"
  | "deleteCurrentProject"
  | "loadSavedProject"
  | "listRecentProjects"
  | "importProject"
  | "createCatalog"
  | "switchCatalog"
  | "renameCatalog"
  | "deleteCatalog"
  | "listCatalogs"
  | "exportCatalog"
  | "importCatalog"
  | "restoreLastOpenedWorkspace"
  | "resetToDefaultEmptyWorkspace"
>;

export function createProjectStoreLifecycleActions(
  set: ProjectStoreSet,
  get: ProjectStoreGet,
): LifecycleActions {
  return {
    newProject: () => {
      set({
        activeFitTarget: "ups-vb-edge",
        isProjectUnsaved: true,
        project: createEmptyProject(),
      });
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
      set({
        activeFitTarget: "ups-vb-edge",
        isProjectUnsaved: true,
        project: createEmptyProject(),
      });
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
  };
}
