import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useProjectStore } from "../store/projectStore";
import type { CatalogRecord, ProjectRecord } from "../store/projectTypes";
import { ContextMenu, useContextMenu } from "./ContextMenu";
import { useUserSettingsStore } from "./Settings";
import { ToastViewport, useToastStore } from "./Toast";
import { UpsIpTitleSelector } from "./workspace/UpsIpTitleSelector";
import { createWorkspaceFileActions } from "./workspace/WorkspaceFileActions";
import {
  useLastOpenedWorkspaceRestore,
  useLastOpenedWorkspaceWriter,
} from "./workspace/WorkspaceLastOpened";
import { createWorkspaceModalActions } from "./workspace/WorkspaceModalActions";
import { WorkspaceModalLayer } from "./workspace/WorkspaceModalLayer";
import { useWorkspaceViewport } from "./workspace/WorkspaceViewport";
import { buildMenuGroups, TopBar } from "./workspace/WorkspaceMenu";
import {
  type AnalysisControlTab,
  iconForWindow,
  renderWindow,
  titleForWindow,
  windowContextItems,
} from "./workspace/WorkspaceWindows";
import { tabForWindowKind } from "./workspace/workspaceTabs";
import { WindowFrame } from "./windows/WindowFrame";

export function Workspace() {
  const project = useProjectStore((state) => state.project);
  const activeCatalog = useProjectStore((state) => state.activeCatalog);
  const updateWindow = useProjectStore((state) => state.updateWindow);
  const focusWindow = useProjectStore((state) => state.focusWindow);
  const resetWindowPosition = useProjectStore((state) => state.resetWindowPosition);
  const resetWindowSize = useProjectStore((state) => state.resetWindowSize);
  const resetAllWindowPositions = useProjectStore((state) => state.resetAllWindowPositions);
  const resetAllWindowSizes = useProjectStore((state) => state.resetAllWindowSizes);
  const recalculate = useProjectStore((state) => state.recalculate);
  const newProject = useProjectStore((state) => state.newProject);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);
  const saveProjectAs = useProjectStore((state) => state.saveProjectAs);
  const renameCurrentProject = useProjectStore((state) => state.renameCurrentProject);
  const loadSavedProject = useProjectStore((state) => state.loadSavedProject);
  const listRecentProjects = useProjectStore((state) => state.listRecentProjects);
  const importProject = useProjectStore((state) => state.importProject);
  const assignDataset = useProjectStore((state) => state.assignDataset);
  const deleteCurrentProject = useProjectStore((state) => state.deleteCurrentProject);
  const createCatalog = useProjectStore((state) => state.createCatalog);
  const switchCatalog = useProjectStore((state) => state.switchCatalog);
  const renameCatalog = useProjectStore((state) => state.renameCatalog);
  const deleteCatalog = useProjectStore((state) => state.deleteCatalog);
  const listCatalogs = useProjectStore((state) => state.listCatalogs);
  const exportCatalogBytes = useProjectStore((state) => state.exportCatalog);
  const importCatalogBytes = useProjectStore((state) => state.importCatalog);
  const isProjectUnsaved = useProjectStore((state) => state.isProjectUnsaved);
  const restoreLastOpenedWorkspace = useProjectStore((state) => state.restoreLastOpenedWorkspace);
  const resetToDefaultEmptyWorkspace = useProjectStore(
    (state) => state.resetToDefaultEmptyWorkspace,
  );
  const toggleHelpWindow = useProjectStore((state) => state.toggleHelpWindow);
  const setActiveUpsIpDatasetId = useProjectStore((state) => state.setActiveUpsIpDatasetId);
  const locale = useUserSettingsStore((state) => state.locale);
  const setLocale = useUserSettingsStore((state) => state.setLocale);
  const toggleProjectsWindow = useProjectStore((state) => state.toggleProjectsWindow);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const {
    handlePointerDown: startWorkspacePan,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    goToWindow,
    resetWorkspaceView,
    viewport,
  } = useWorkspaceViewport();
  const workspaceSurfaceRef = useRef<HTMLDivElement>(null);
  const [activeWindowId, setActiveWindowId] = useState<string>();
  const [analysisTab, setAnalysisTab] = useState<AnalysisControlTab>("sample");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [pendingOverwriteName, setPendingOverwriteName] = useState<string>();
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loadProjectOpen, setLoadProjectOpen] = useState(false);
  const [catalogModal, setCatalogModal] = useState<
    "new" | "switch" | "rename" | "delete" | undefined
  >();
  const [lastOpenedRestored, setLastOpenedRestored] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const catalogImportInputRef = useRef<HTMLInputElement>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectRecord[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogRecord[]>([]);
  const pushToast = useToastStore((state) => state.pushToast);
  const windows = useMemo(() => project.windows, [project.windows]);
  useLastOpenedWorkspaceRestore({
    onRestoreFailed: (caught) =>
      pushToast(errorMessage("Last opened workspace restore failed", caught), "error"),
    onRestoreSucceeded: () => pushToast("Last opened project loaded.", "success"),
    resetToDefaultEmptyWorkspace,
    restoreLastOpenedWorkspace,
    setLastOpenedRestored,
  });
  useLastOpenedWorkspaceWriter({
    activeCatalogId: activeCatalog.id,
    isProjectUnsaved,
    lastOpenedRestored,
    projectId: project.id,
  });
  const focusAndActivateWindow = (id: string) => {
    const window = project.windows.find((item) => item.id === id);
    setActiveWindowId(id);
    const nextTab = tabForWindowKind(window?.kind);
    if (nextTab) {
      setAnalysisTab(nextTab);
    }
    focusWindow(id);
  };
  const refreshRecentProjects = () => {
    void listRecentProjects().then(setRecentProjects);
  };
  const refreshCatalogs = () => {
    void listCatalogs().then(setCatalogs);
  };
  const fileActions = createWorkspaceFileActions({
    activeCatalog,
    exportCatalogBytes,
    importCatalogBytes,
    importProject,
    project,
    pushToast,
    refreshCatalogs,
    refreshRecentProjects,
  });
  const modalActions = createWorkspaceModalActions({
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
  });
  const goToWindowPosition = (id: string) => {
    const targetWindow = project.windows.find((window) => window.id === id);
    const viewportRect = workspaceSurfaceRef.current?.getBoundingClientRect();
    if (!targetWindow || !viewportRect) {
      return;
    }
    goToWindow(targetWindow, {
      height: viewportRect.height,
      width: viewportRect.width,
    });
  };
  const menuGroups = buildMenuGroups({
    locale,
    project,
    windows,
    recentProjects,
    actions: {
      createCatalog: () => setCatalogModal("new"),
      deleteCatalog: () => setCatalogModal("delete"),
      deleteProject: () => setDeleteOpen(true),
      exportCatalog: fileActions.exportActiveCatalog,
      exportProject: fileActions.exportProject,
      focusWindow: focusAndActivateWindow,
      goToWindow: goToWindowPosition,
      importCatalog: () => catalogImportInputRef.current?.click(),
      importProject: () => importInputRef.current?.click(),
      loadProject: () => setLoadProjectOpen(true),
      loadSavedProject: (id) => {
        void loadSavedProject(id)
          .then(() => {
            pushToast("Project loaded.", "success");
          })
          .catch((caught: unknown) => {
            pushToast(errorMessage("Project load failed", caught), "error");
          });
      },
      newProject,
      renameCatalog: () => setCatalogModal("rename"),
      renameProject: () => setRenameProjectOpen(true),
      resetWorkspaceView,
      resetAllWindowPositions,
      resetAllWindowSizes,
      resetWindowPosition,
      resetWindowSize,
      saveAsProject: () => setSaveAsOpen(true),
      saveCurrentProject: () => {
        void saveCurrentProject()
          .then((result) => {
            if (result === "needs-name") {
              setSaveAsOpen(true);
              return;
            }
            refreshRecentProjects();
            pushToast("Project saved.", "success");
          })
          .catch((caught: unknown) => {
            pushToast(errorMessage("Project save failed", caught), "error");
          });
      },
      setLocale,
      switchCatalog: () => {
        refreshCatalogs();
        setCatalogModal("switch");
      },
      toggleHelpWindow,
      toggleProjectsWindow,
    },
  });
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isBackground =
      target.dataset.workspaceSurface === "true" || target.dataset.workspacePlane === "true";
    if (event.button === 0 && isBackground) {
      setActiveWindowId(undefined);
    }
    startWorkspacePan(event);
  };
  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-workspace-surface='true'], [data-workspace-plane='true']")) {
      return;
    }
    if (target.closest(".workspace-window")) {
      return;
    }
    event.preventDefault();
    refreshRecentProjects();
    openMenu(
      event.clientX,
      event.clientY,
      menuGroups.map((group) => ({
        type: "submenu",
        label: group.label,
        items: group.items,
      })),
    );
  };
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#eef4f6] text-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(20,47,61,0.10)_1px,transparent_0)] bg-[length:18px_18px]"
        style={{
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${18 * viewport.scale}px ${18 * viewport.scale}px`,
        }}
      />
      <input
        ref={importInputRef}
        className="sr-only"
        type="file"
        accept=".upsleips,.gz,.json,application/json,application/gzip"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          void fileActions.importProjectFile(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={catalogImportInputRef}
        className="sr-only"
        type="file"
        accept=".upsleips-catalog,.gz,.json,application/json,application/gzip"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          void fileActions.importCatalogFile(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <TopBar
        menuGroups={menuGroups}
        onMenuOpen={refreshRecentProjects}
        zoomScale={viewport.scale}
      />
      <div
        ref={workspaceSurfaceRef}
        className="absolute inset-x-0 bottom-0 top-10 cursor-grab overflow-hidden active:cursor-grabbing"
        data-workspace-surface="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <div
          className="absolute left-0 top-0 h-[2400px] w-[2400px]"
          data-workspace-plane="true"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {windows.map((window) => (
            <WindowFrame
              key={window.id}
              icon={iconForWindow(window.kind)}
              scale={viewport.scale}
              window={{
                ...window,
                title: titleForWindow(window, project.datasets, project.analysis.selection),
              }}
              onFocus={() => focusAndActivateWindow(window.id)}
              onChange={(patch) => updateWindow(window.id, patch)}
              contextMenuItems={windowContextItems(window, {
                assignDataset,
                datasets: project.datasets,
                recalculate,
                resetWindowPosition,
                resetWindowSize,
                selection: project.analysis.selection,
              })}
              isActive={activeWindowId === window.id}
              titleBarAccessory={
                window.kind === "ups-ip" || window.kind === "ups" ? (
                  <UpsIpTitleSelector
                    activeDatasetId={project.ui?.activeUpsIpDatasetId}
                    datasetIds={project.analysis.selection.upsIpDatasetIds ?? []}
                    datasets={project.datasets}
                    onChange={setActiveUpsIpDatasetId}
                  />
                ) : undefined
              }
            >
              {renderWindow(window, analysisTab)}
            </WindowFrame>
          ))}
        </div>
      </div>
      <ContextMenu menu={menu} onClose={closeMenu} />
      <WorkspaceModalLayer
        activeCatalog={activeCatalog}
        catalogModal={catalogModal}
        catalogs={catalogs}
        deleteOpen={deleteOpen}
        loadProjectOpen={loadProjectOpen}
        pendingOverwriteName={pendingOverwriteName}
        project={project}
        recentProjects={recentProjects}
        renameProjectOpen={renameProjectOpen}
        saveAsOpen={saveAsOpen}
        actions={modalActions}
      />
      <ToastViewport />
    </main>
  );
}

function errorMessage(prefix: string, caught: unknown): string {
  return `${prefix}: ${caught instanceof Error ? caught.message : String(caught)}`;
}
