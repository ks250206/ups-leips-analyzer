import type { CatalogRecord, ProjectRecord } from "../../store/projectTypes";

export function createWorkspaceModalActions({
  activeCatalog,
  createCatalog,
  deleteCatalog,
  deleteCurrentProject,
  listRecentProjects,
  loadSavedProject,
  pushToast,
  refreshCatalogs,
  refreshRecentProjects,
  renameCatalog,
  renameCurrentProject,
  saveProjectAs,
  setCatalogModal,
  setDeleteOpen,
  setLoadProjectOpen,
  setPendingOverwriteName,
  setRenameProjectOpen,
  setSaveAsOpen,
  switchCatalog,
}: {
  activeCatalog: CatalogRecord;
  createCatalog: (name: string) => Promise<void>;
  deleteCatalog: (id: string) => Promise<void>;
  deleteCurrentProject: () => Promise<void>;
  listRecentProjects: () => Promise<ProjectRecord[]>;
  loadSavedProject: (id: string) => Promise<void>;
  pushToast: (message: string, kind: "success" | "error") => void;
  refreshCatalogs: () => void;
  refreshRecentProjects: () => void;
  renameCatalog: (id: string, name: string) => Promise<void>;
  renameCurrentProject: (name: string) => Promise<void>;
  saveProjectAs: (name: string) => Promise<void>;
  setCatalogModal: (modal: "new" | "switch" | "rename" | "delete" | undefined) => void;
  setDeleteOpen: (open: boolean) => void;
  setLoadProjectOpen: (open: boolean) => void;
  setPendingOverwriteName: (name: string | undefined) => void;
  setRenameProjectOpen: (open: boolean) => void;
  setSaveAsOpen: (open: boolean) => void;
  switchCatalog: (id: string) => Promise<void>;
}) {
  return {
    closeCatalogModal: () => setCatalogModal(undefined),
    closeDelete: () => setDeleteOpen(false),
    closeLoadProject: () => setLoadProjectOpen(false),
    closeOverwrite: () => setPendingOverwriteName(undefined),
    closeRenameProject: () => setRenameProjectOpen(false),
    closeSaveAs: () => setSaveAsOpen(false),
    confirmOverwrite: (name: string) => {
      void saveProjectAs(name)
        .then(() => {
          refreshRecentProjects();
          setPendingOverwriteName(undefined);
          pushToast("Project saved.", "success");
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Project save failed", caught), "error");
        });
    },
    createCatalog: (name: string) => {
      void createCatalog(name)
        .then(() => {
          refreshCatalogs();
          refreshRecentProjects();
          setCatalogModal(undefined);
          pushToast("Catalog created.", "success");
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Catalog create failed", caught), "error");
        });
    },
    deleteCatalog: () => {
      void deleteCatalog(activeCatalog.id)
        .then(() => {
          refreshCatalogs();
          refreshRecentProjects();
          setCatalogModal(undefined);
          pushToast("Catalog deleted.", "success");
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Catalog delete failed", caught), "error");
        });
    },
    deleteProject: () => {
      void deleteCurrentProject().then(() => {
        refreshRecentProjects();
        setDeleteOpen(false);
      });
    },
    loadProject: (id: string) => {
      void loadSavedProject(id)
        .then(() => {
          refreshRecentProjects();
          setLoadProjectOpen(false);
          pushToast("Project loaded.", "success");
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Project load failed", caught), "error");
        });
    },
    renameCatalog: (name: string) => {
      void renameCatalog(activeCatalog.id, name)
        .then(() => {
          refreshCatalogs();
          setCatalogModal(undefined);
          pushToast("Catalog renamed.", "success");
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Catalog rename failed", caught), "error");
        });
    },
    renameProject: (name: string) => {
      void renameCurrentProject(name)
        .then(() => {
          refreshRecentProjects();
          setRenameProjectOpen(false);
          pushToast("Project renamed.", "success");
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Project rename failed", caught), "error");
        });
    },
    reopenSaveAsFromOverwrite: () => {
      setSaveAsOpen(true);
      setPendingOverwriteName(undefined);
    },
    saveAs: (name: string) => {
      void listRecentProjects()
        .then((projects) => {
          const existing = projects.find((record) => record.name === name.trim());
          if (existing) {
            setPendingOverwriteName(name.trim());
            setSaveAsOpen(false);
            return Promise.resolve();
          }
          return saveProjectAs(name).then(() => {
            refreshRecentProjects();
            setSaveAsOpen(false);
            pushToast("Project saved.", "success");
          });
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Project save failed", caught), "error");
        });
    },
    switchCatalog: (id: string) => {
      void switchCatalog(id)
        .then(() => {
          refreshCatalogs();
          refreshRecentProjects();
          setCatalogModal(undefined);
          pushToast("Catalog switched.", "success");
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Catalog switch failed", caught), "error");
        });
    },
  };
}

function errorMessage(prefix: string, caught: unknown): string {
  return `${prefix}: ${caught instanceof Error ? caught.message : String(caught)}`;
}
