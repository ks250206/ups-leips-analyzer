import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { exportProjectGzip, exportProjectJson, importProjectBytes } from "../store/projectDb";
import { useProjectStore } from "../store/projectStore";
import type { ProjectRecord, WindowLayout } from "../store/projectTypes";
import { ContextMenu, useContextMenu } from "./ContextMenu";
import { ToastViewport, useToastStore } from "./Toast";
import { useSettingsStore } from "./Settings";
import { buildMenuGroups, resolveMenuItems, TopBar } from "./workspace/WorkspaceMenu";
import { DeleteProjectModal, LoadProjectModal, SaveAsModal } from "./workspace/WorkspaceModals";
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
  const loadSavedProject = useProjectStore((state) => state.loadSavedProject);
  const listRecentProjects = useProjectStore((state) => state.listRecentProjects);
  const importProject = useProjectStore((state) => state.importProject);
  const assignDataset = useProjectStore((state) => state.assignDataset);
  const deleteCurrentProject = useProjectStore((state) => state.deleteCurrentProject);
  const toggleHelpWindow = useProjectStore((state) => state.toggleHelpWindow);
  const toggleProjectsWindow = useProjectStore((state) => state.toggleProjectsWindow);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [activeWindowId, setActiveWindowId] = useState<string>();
  const [analysisTab, setAnalysisTab] = useState<AnalysisControlTab>("data");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loadProjectOpen, setLoadProjectOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectRecord[]>([]);
  const pushToast = useToastStore((state) => state.pushToast);
  const cursorStyle = useSettingsStore((state) => state.cursorStyle);
  const setCursorStyle = useSettingsStore((state) => state.setCursorStyle);
  const panStart = useRef<{ x: number; y: number; originX: number; originY: number } | undefined>(
    undefined,
  );
  const windows = useMemo(() => project.windows, [project.windows]);
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
  const menuGroups = buildMenuGroups({
    project,
    windows,
    recentProjects,
    actions: {
      deleteProject: () => setDeleteOpen(true),
      exportProject,
      focusWindow: focusAndActivateWindow,
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
      resetWorkspaceView,
      resetAllWindowPositions,
      resetAllWindowSizes,
      resetWindowPosition,
      resetWindowSize,
      saveAsProject: () => setSaveAsOpen(true),
      saveCurrentProject: () => {
        void saveCurrentProject()
          .then(() => {
            refreshRecentProjects();
            pushToast("Project saved.", "success");
          })
          .catch((caught: unknown) => {
            pushToast(errorMessage("Project save failed", caught), "error");
          });
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
        items: resolveMenuItems(group, cursorStyle, setCursorStyle),
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
      <TopBar menuGroups={menuGroups} onMenuOpen={refreshRecentProjects} />
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
            void saveProjectAs(name)
              .then(() => {
                refreshRecentProjects();
                setSaveAsOpen(false);
                pushToast("Project saved.", "success");
              })
              .catch((caught: unknown) => {
                pushToast(errorMessage("Project save failed", caught), "error");
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
