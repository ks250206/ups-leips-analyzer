import {
  useMemo,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { exportProjectGzip, exportProjectJson, importProjectBytes } from "../store/projectDb";
import { readLastOpenedWorkspace, writeLastOpenedWorkspace } from "../store/lastOpenedWorkspace";
import { useProjectStore } from "../store/projectStore";
import type { CatalogRecord, ProjectRecord, WindowLayout } from "../store/projectTypes";
import { ContextMenu, useContextMenu } from "./ContextMenu";
import { useUserSettingsStore } from "./Settings";
import { ToastViewport, useToastStore } from "./Toast";
import { buildMenuGroups, TopBar } from "./workspace/WorkspaceMenu";
import {
  CatalogNameModal,
  DeleteCatalogModal,
  DeleteProjectModal,
  LoadProjectModal,
  OverwriteProjectModal,
  SaveAsModal,
  SwitchCatalogModal,
} from "./workspace/WorkspaceModals";
import {
  type AnalysisControlTab,
  iconForWindow,
  renderWindow,
  titleForWindow,
  windowContextItems,
} from "./workspace/WorkspaceWindows";
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
  const locale = useUserSettingsStore((state) => state.locale);
  const setLocale = useUserSettingsStore((state) => state.setLocale);
  const toggleProjectsWindow = useProjectStore((state) => state.toggleProjectsWindow);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
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
  const panStart = useRef<{ x: number; y: number; originX: number; originY: number } | undefined>(
    undefined,
  );
  const windows = useMemo(() => project.windows, [project.windows]);
  useEffect(() => {
    const ref = readLastOpenedWorkspace();
    if (!ref) {
      setLastOpenedRestored(true);
      return;
    }
    void restoreLastOpenedWorkspace(ref)
      .then(() => {
        pushToast("Last opened project loaded.", "success");
      })
      .catch((caught: unknown) => {
        return resetToDefaultEmptyWorkspace().then(() => {
          pushToast(errorMessage("Last opened workspace restore failed", caught), "error");
        });
      })
      .finally(() => setLastOpenedRestored(true));
  }, [pushToast, resetToDefaultEmptyWorkspace, restoreLastOpenedWorkspace]);
  useEffect(() => {
    if (!lastOpenedRestored) {
      return;
    }
    writeLastOpenedWorkspace({
      catalogId: activeCatalog.id,
      projectId: isProjectUnsaved ? undefined : project.id,
    });
  }, [activeCatalog.id, isProjectUnsaved, lastOpenedRestored, project.id]);
  const resetWorkspaceView = () => setViewport({ x: 0, y: 0, scale: 1 });
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
  const exportProject = () => {
    try {
      const compressed = exportProjectGzip(project);
      const blob = new Blob([compressed.slice().buffer as ArrayBuffer], {
        type: "application/gzip",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${project.name
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()}.upsleips.json.gz`;
      anchor.click();
      URL.revokeObjectURL(url);
      pushToast("Project exported.", "success");
    } catch (caught) {
      pushToast(errorMessage("Project export failed", caught), "error");
    }
  };
  const importProjectFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    try {
      importProject(exportProjectJson(importProjectBytes(await file.arrayBuffer())));
      pushToast(`Project imported from ${file.name}.`, "success");
    } catch (caught) {
      pushToast(errorMessage("Project import failed", caught), "error");
    }
  };
  const exportActiveCatalog = () => {
    void exportCatalogBytes(activeCatalog.id)
      .then((compressed) => {
        const blob = new Blob([compressed.slice().buffer as ArrayBuffer], {
          type: "application/gzip",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${activeCatalog.name
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase()}.upsleips-catalog.json.gz`;
        anchor.click();
        URL.revokeObjectURL(url);
        pushToast("Catalog exported.", "success");
      })
      .catch((caught: unknown) => {
        pushToast(errorMessage("Catalog export failed", caught), "error");
      });
  };
  const importCatalogFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    try {
      const catalog = await importCatalogBytes(await file.arrayBuffer());
      refreshCatalogs();
      refreshRecentProjects();
      pushToast(`Catalog imported: ${catalog.name}.`, "success");
    } catch (caught) {
      pushToast(errorMessage("Catalog import failed", caught), "error");
    }
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
      exportCatalog: exportActiveCatalog,
      exportProject,
      focusWindow: focusAndActivateWindow,
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
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-plot-host='true']") && !event.metaKey && !event.ctrlKey) {
      return;
    }
    if (!event.metaKey && !event.ctrlKey && target.closest(".workspace-window")) {
      return;
    }
    event.preventDefault();
    if (event.metaKey || event.ctrlKey) {
      const nextScale = Math.min(2, Math.max(0.45, viewport.scale - event.deltaY * 0.001));
      const scale = Number(nextScale.toFixed(2));
      const worldX = (event.clientX - viewport.x) / viewport.scale;
      const worldY = (event.clientY - viewport.y) / viewport.scale;
      setViewport({
        x: event.clientX - worldX * scale,
        y: event.clientY - worldY * scale,
        scale,
      });
      return;
    }
    const horizontalDelta = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
    setViewport({
      ...viewport,
      x: viewport.x - horizontalDelta,
      y: viewport.y - (event.shiftKey ? 0 : event.deltaY),
    });
  };
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isBackground =
      target.dataset.workspaceSurface === "true" || target.dataset.workspacePlane === "true";
    if (event.button !== 0 || !isBackground) {
      return;
    }
    setActiveWindowId(undefined);
    panStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
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
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = panStart.current;
    if (!drag) {
      return;
    }
    setViewport({
      ...viewport,
      x: drag.originX + event.clientX - drag.x,
      y: drag.originY + event.clientY - drag.y,
    });
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    panStart.current = undefined;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
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
          void importProjectFile(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={catalogImportInputRef}
        className="sr-only"
        type="file"
        accept=".upsleips-catalog,.gz,.json,application/json,application/gzip"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          void importCatalogFile(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <TopBar
        menuGroups={menuGroups}
        onMenuOpen={refreshRecentProjects}
        zoomScale={viewport.scale}
      />
      <div
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
          className="absolute left-0 top-0 h-full w-full"
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
            >
              {renderWindow(window, analysisTab)}
            </WindowFrame>
          ))}
        </div>
      </div>
      <ContextMenu menu={menu} onClose={closeMenu} />
      {saveAsOpen ? (
        <SaveAsModal
          defaultName={project.name}
          onCancel={() => setSaveAsOpen(false)}
          onSave={(name) => {
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
          }}
        />
      ) : null}
      {pendingOverwriteName ? (
        <OverwriteProjectModal
          projectName={pendingOverwriteName}
          onCancel={() => setPendingOverwriteName(undefined)}
          onRename={() => {
            setSaveAsOpen(true);
            setPendingOverwriteName(undefined);
          }}
          onConfirm={() => {
            void saveProjectAs(pendingOverwriteName)
              .then(() => {
                refreshRecentProjects();
                setPendingOverwriteName(undefined);
                pushToast("Project saved.", "success");
              })
              .catch((caught: unknown) => {
                pushToast(errorMessage("Project save failed", caught), "error");
              });
          }}
        />
      ) : null}
      {renameProjectOpen ? (
        <SaveAsModal
          actionLabel="Rename"
          defaultName={project.name}
          helpText="This changes the current project name without changing its project ID."
          title="Rename Project"
          onCancel={() => setRenameProjectOpen(false)}
          onSave={(name) => {
            void renameCurrentProject(name)
              .then(() => {
                refreshRecentProjects();
                setRenameProjectOpen(false);
                pushToast("Project renamed.", "success");
              })
              .catch((caught: unknown) => {
                pushToast(errorMessage("Project rename failed", caught), "error");
              });
          }}
        />
      ) : null}
      {deleteOpen ? (
        <DeleteProjectModal
          projectName={project.name}
          onCancel={() => setDeleteOpen(false)}
          onDelete={() => {
            void deleteCurrentProject().then(() => {
              refreshRecentProjects();
              setDeleteOpen(false);
            });
          }}
        />
      ) : null}
      {loadProjectOpen ? (
        <LoadProjectModal
          projects={recentProjects}
          onCancel={() => setLoadProjectOpen(false)}
          onLoad={(id) => {
            void loadSavedProject(id)
              .then(() => {
                refreshRecentProjects();
                setLoadProjectOpen(false);
                pushToast("Project loaded.", "success");
              })
              .catch((caught: unknown) => {
                pushToast(errorMessage("Project load failed", caught), "error");
              });
          }}
        />
      ) : null}
      {catalogModal === "new" ? (
        <CatalogNameModal
          actionLabel="Create"
          defaultName="New Catalog"
          title="New Catalog"
          onCancel={() => setCatalogModal(undefined)}
          onSave={(name) => {
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
          }}
        />
      ) : null}
      {catalogModal === "rename" ? (
        <CatalogNameModal
          actionLabel="Save"
          defaultName={activeCatalog.name}
          title="Rename Catalog"
          onCancel={() => setCatalogModal(undefined)}
          onSave={(name) => {
            void renameCatalog(activeCatalog.id, name)
              .then(() => {
                refreshCatalogs();
                setCatalogModal(undefined);
                pushToast("Catalog renamed.", "success");
              })
              .catch((caught: unknown) => {
                pushToast(errorMessage("Catalog rename failed", caught), "error");
              });
          }}
        />
      ) : null}
      {catalogModal === "delete" ? (
        <DeleteCatalogModal
          catalogName={activeCatalog.name}
          onCancel={() => setCatalogModal(undefined)}
          onDelete={() => {
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
          }}
        />
      ) : null}
      {catalogModal === "switch" ? (
        <SwitchCatalogModal
          activeCatalogId={activeCatalog.id}
          catalogs={catalogs}
          onCancel={() => setCatalogModal(undefined)}
          onSwitch={(id) => {
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
          }}
        />
      ) : null}
      <ToastViewport />
    </main>
  );
}

function errorMessage(prefix: string, caught: unknown): string {
  return `${prefix}: ${caught instanceof Error ? caught.message : String(caught)}`;
}

function tabForWindowKind(kind: WindowLayout["kind"] | undefined): AnalysisControlTab | undefined {
  switch (kind) {
    case "ups":
    case "ups-vb":
    case "ups-ip":
      return "ups";
    case "leips":
    case "leips-evac":
      return "leips";
    case "reels":
      return "reels";
    case "band":
      return "band";
    case "browser":
    case "table":
      return "data";
    default:
      return undefined;
  }
}
