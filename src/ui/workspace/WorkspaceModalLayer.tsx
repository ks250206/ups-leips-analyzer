import type { CatalogRecord, ProjectRecord, ProjectSnapshot } from "../../store/projectTypes";
import {
  CatalogNameModal,
  DeleteCatalogModal,
  DeleteProjectModal,
  LoadProjectModal,
  OverwriteProjectModal,
  SaveAsModal,
  SwitchCatalogModal,
} from "./WorkspaceModals";

type CatalogModal = "new" | "switch" | "rename" | "delete" | undefined;

export function WorkspaceModalLayer({
  activeCatalog,
  catalogModal,
  catalogs,
  deleteOpen,
  loadProjectOpen,
  pendingOverwriteName,
  project,
  recentProjects,
  renameProjectOpen,
  saveAsOpen,
  actions,
}: {
  activeCatalog: CatalogRecord;
  catalogModal: CatalogModal;
  catalogs: CatalogRecord[];
  deleteOpen: boolean;
  loadProjectOpen: boolean;
  pendingOverwriteName: string | undefined;
  project: ProjectSnapshot;
  recentProjects: ProjectRecord[];
  renameProjectOpen: boolean;
  saveAsOpen: boolean;
  actions: {
    closeCatalogModal: () => void;
    closeDelete: () => void;
    closeLoadProject: () => void;
    closeOverwrite: () => void;
    closeRenameProject: () => void;
    closeSaveAs: () => void;
    confirmOverwrite: (name: string) => void;
    createCatalog: (name: string) => void;
    deleteCatalog: () => void;
    deleteProject: () => void;
    loadProject: (id: string) => void;
    renameCatalog: (name: string) => void;
    renameProject: (name: string) => void;
    reopenSaveAsFromOverwrite: () => void;
    saveAs: (name: string) => void;
    switchCatalog: (id: string) => void;
  };
}) {
  return (
    <>
      {saveAsOpen ? (
        <SaveAsModal
          defaultName={project.name}
          onCancel={actions.closeSaveAs}
          onSave={actions.saveAs}
        />
      ) : null}
      {pendingOverwriteName ? (
        <OverwriteProjectModal
          projectName={pendingOverwriteName}
          onCancel={actions.closeOverwrite}
          onRename={actions.reopenSaveAsFromOverwrite}
          onConfirm={() => actions.confirmOverwrite(pendingOverwriteName)}
        />
      ) : null}
      {renameProjectOpen ? (
        <SaveAsModal
          actionLabel="Rename"
          defaultName={project.name}
          helpText="This changes the current project name without changing its project ID."
          title="Rename Project"
          onCancel={actions.closeRenameProject}
          onSave={actions.renameProject}
        />
      ) : null}
      {deleteOpen ? (
        <DeleteProjectModal
          projectName={project.name}
          onCancel={actions.closeDelete}
          onDelete={actions.deleteProject}
        />
      ) : null}
      {loadProjectOpen ? (
        <LoadProjectModal
          projects={recentProjects}
          onCancel={actions.closeLoadProject}
          onLoad={actions.loadProject}
        />
      ) : null}
      {catalogModal === "new" ? (
        <CatalogNameModal
          actionLabel="Create"
          defaultName="New Catalog"
          title="New Catalog"
          onCancel={actions.closeCatalogModal}
          onSave={actions.createCatalog}
        />
      ) : null}
      {catalogModal === "rename" ? (
        <CatalogNameModal
          actionLabel="Save"
          defaultName={activeCatalog.name}
          title="Rename Catalog"
          onCancel={actions.closeCatalogModal}
          onSave={actions.renameCatalog}
        />
      ) : null}
      {catalogModal === "delete" ? (
        <DeleteCatalogModal
          catalogName={activeCatalog.name}
          onCancel={actions.closeCatalogModal}
          onDelete={actions.deleteCatalog}
        />
      ) : null}
      {catalogModal === "switch" ? (
        <SwitchCatalogModal
          activeCatalogId={activeCatalog.id}
          catalogs={catalogs}
          onCancel={actions.closeCatalogModal}
          onSwitch={actions.switchCatalog}
        />
      ) : null}
    </>
  );
}
