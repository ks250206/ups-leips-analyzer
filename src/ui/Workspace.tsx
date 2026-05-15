import {
  Activity,
  BarChart3,
  FolderOpen,
  HelpCircle,
  LineChart,
  ListChecks,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
} from "react";
import { exportProjectGzip, exportProjectJson, importProjectBytes } from "../store/projectDb";
import { useProjectStore } from "../store/projectStore";
import type { ProjectRecord, WindowLayout } from "../store/projectTypes";
import { ContextMenu, type ContextMenuItem, useContextMenu } from "./ContextMenu";
import { AnalysisControls } from "./windows/AnalysisControls";
import { BandDiagramWindow } from "./windows/BandDiagramWindow";
import { DataBrowser } from "./windows/DataBrowser";
import { DataTable } from "./windows/DataTable";
import { LEIPSEvacPlotWindow, LEIPSPlotWindow } from "./windows/LEIPSPlotWindow";
import { ProjectListWindow, ProjectTable } from "./windows/ProjectListWindow";
import { UPSIPPlotWindow, UPSVBPlotWindow } from "./windows/UPSPlotWindow";
import { WindowFrame } from "./windows/WindowFrame";

export function Workspace() {
  const project = useProjectStore((state) => state.project);
  const updateWindow = useProjectStore((state) => state.updateWindow);
  const focusWindow = useProjectStore((state) => state.focusWindow);
  const recalculate = useProjectStore((state) => state.recalculate);
  const newProject = useProjectStore((state) => state.newProject);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);
  const saveProjectAs = useProjectStore((state) => state.saveProjectAs);
  const loadSavedProject = useProjectStore((state) => state.loadSavedProject);
  const listRecentProjects = useProjectStore((state) => state.listRecentProjects);
  const importProject = useProjectStore((state) => state.importProject);
  const deleteCurrentProject = useProjectStore((state) => state.deleteCurrentProject);
  const toggleHelpWindow = useProjectStore((state) => state.toggleHelpWindow);
  const toggleProjectsWindow = useProjectStore((state) => state.toggleProjectsWindow);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loadProjectOpen, setLoadProjectOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectRecord[]>([]);
  const panStart = useRef<{ x: number; y: number; originX: number; originY: number } | undefined>(
    undefined,
  );
  const windows = useMemo(() => project.windows, [project.windows]);
  const maxWindowZ = useMemo(() => Math.max(...windows.map((window) => window.zIndex)), [windows]);
  const resetWorkspaceView = () => setViewport({ x: 0, y: 0, scale: 1 });
  const refreshRecentProjects = () => {
    void listRecentProjects().then(setRecentProjects);
  };
  const exportProject = () => {
    const compressed = exportProjectGzip(project);
    const blob = new Blob([compressed.slice().buffer as ArrayBuffer], { type: "application/gzip" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.upsleips.json.gz`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importProjectFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    importProject(exportProjectJson(importProjectBytes(await file.arrayBuffer())));
  };
  const menuGroups = buildMenuGroups({
    project,
    windows,
    recentProjects,
    actions: {
      deleteProject: () => setDeleteOpen(true),
      exportProject,
      focusWindow,
      importProject: () => importInputRef.current?.click(),
      loadProject: () => setLoadProjectOpen(true),
      loadSavedProject: (id) => {
        void loadSavedProject(id);
      },
      newProject,
      resetWorkspaceView,
      saveAsProject: () => setSaveAsOpen(true),
      saveCurrentProject: () => {
        void saveCurrentProject().then(refreshRecentProjects);
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
      menuGroups.map((group) => ({ type: "submenu", ...group })),
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
              window={window}
              onFocus={() => focusWindow(window.id)}
              onChange={(patch) => updateWindow(window.id, patch)}
              contextMenuItems={windowContextItems(window, { recalculate })}
              isActive={window.zIndex === maxWindowZ}
            >
              {renderWindow(window)}
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
            void saveProjectAs(name).then(() => {
              refreshRecentProjects();
              setSaveAsOpen(false);
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
            void loadSavedProject(id).then(() => {
              refreshRecentProjects();
              setLoadProjectOpen(false);
            });
          }}
        />
      ) : null}
    </main>
  );
}

function TopBar({ menuGroups, onMenuOpen }: { menuGroups: MenuGroup[]; onMenuOpen: () => void }) {
  const project = useProjectStore((state) => state.project);
  const recalculate = useProjectStore((state) => state.recalculate);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [activeMenu, setActiveMenu] = useState<string>();
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const openGroup = (group: MenuGroup) => {
    const rect = buttonRefs.current.get(group.label)?.getBoundingClientRect();
    setActiveMenu(group.label);
    onMenuOpen();
    openMenu(rect?.left ?? 0, rect?.bottom ?? 0, group.items);
  };
  const closeTopMenu = () => {
    setActiveMenu(undefined);
    closeMenu();
  };

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex h-10 items-center justify-between border-b border-slate-300 bg-slate-950 px-3 text-sm text-slate-100">
      <div className="flex items-center gap-3">
        <Activity size={16} className="text-cyan-300" />
        <h1 className="font-semibold">UPS-LEIPS Analyzer</h1>
        {menuGroups.map((group) => (
          <button
            key={group.label}
            ref={(element) => {
              if (element) {
                buttonRefs.current.set(group.label, element);
              } else {
                buttonRefs.current.delete(group.label);
              }
            }}
            className={
              activeMenu === group.label
                ? "rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100"
                : "rounded px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            }
            type="button"
            onClick={() => openGroup(group)}
            onMouseEnter={() => {
              if (menu) {
                openGroup(group);
              }
            }}
          >
            {group.label}
          </button>
        ))}
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
          {project.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
          type="button"
          onClick={recalculate}
        >
          Recalculate
        </button>
      </div>
      <ContextMenu menu={menu} onClose={closeTopMenu} />
    </header>
  );
}

interface MenuGroup {
  label: string;
  items: ContextMenuItem[];
}

function buildMenuGroups(input: {
  project: { name: string };
  windows: WindowLayout[];
  recentProjects: ProjectRecord[];
  actions: {
    deleteProject: () => void;
    exportProject: () => void;
    focusWindow: (id: string) => void;
    importProject: () => void;
    loadProject: () => void;
    loadSavedProject: (id: string) => void;
    newProject: () => void;
    resetWorkspaceView: () => void;
    saveAsProject: () => void;
    saveCurrentProject: () => void;
    toggleHelpWindow: () => void;
    toggleProjectsWindow: () => void;
  };
}): MenuGroup[] {
  const windowsItems: ContextMenuItem[] = input.windows.map((window) => ({
    type: "item",
    label: window.title,
    action: () => input.actions.focusWindow(window.id),
  }));
  if (!input.windows.some((window) => window.id === "help")) {
    windowsItems.push({
      type: "item",
      label: "Help",
      action: input.actions.toggleHelpWindow,
    });
  }
  return [
    {
      label: "Project",
      items: [
        { type: "item", label: "New Project", action: input.actions.newProject },
        { type: "item", label: "Save Project", action: input.actions.saveCurrentProject },
        { type: "item", label: "Save as ...", action: input.actions.saveAsProject },
        { type: "item", label: "Load Project", action: input.actions.loadProject },
        { type: "item", label: "Delete project", action: input.actions.deleteProject },
        { type: "separator" },
        { type: "item", label: "Export", action: input.actions.exportProject },
        { type: "item", label: "Import", action: input.actions.importProject },
        { type: "item", label: "Project list", action: input.actions.toggleProjectsWindow },
        { type: "separator" },
        {
          type: "submenu",
          label: "Recent project",
          items:
            input.recentProjects.length > 0
              ? input.recentProjects.map((record) => ({
                  type: "item",
                  label: record.name,
                  action: () => input.actions.loadSavedProject(record.id),
                }))
              : [{ type: "item", label: "No recent projects", disabled: true }],
        },
      ],
    },
    {
      label: "View",
      items: [{ type: "item", label: "Reset view", action: input.actions.resetWorkspaceView }],
    },
    {
      label: "Windows",
      items: windowsItems,
    },
    {
      label: "Help",
      items: [
        { type: "item", label: "About UPS-LEIPS Analyzer", action: input.actions.toggleHelpWindow },
      ],
    },
  ];
}

function renderWindow(window: WindowLayout) {
  switch (window.kind) {
    case "browser":
      return <DataBrowser />;
    case "table":
      return <DataTable />;
    case "ups":
    case "ups-ip":
      return <UPSIPPlotWindow />;
    case "ups-vb":
      return <UPSVBPlotWindow />;
    case "leips":
      return <LEIPSPlotWindow />;
    case "leips-evac":
      return <LEIPSEvacPlotWindow />;
    case "band":
      return <BandDiagramWindow />;
    case "controls":
      return <AnalysisControls />;
    case "help":
      return <HelpWindow />;
    case "projects":
      return <ProjectListWindow />;
  }
}

function iconForWindow(kind: WindowLayout["kind"]) {
  switch (kind) {
    case "browser":
      return <FolderOpen size={14} />;
    case "table":
      return <Table2 size={14} />;
    case "ups":
    case "ups-vb":
    case "ups-ip":
    case "leips":
    case "leips-evac":
      return <LineChart size={14} />;
    case "band":
      return <BarChart3 size={14} />;
    case "controls":
      return <SlidersHorizontal size={14} />;
    case "help":
      return <HelpCircle size={14} />;
    case "projects":
      return <ListChecks size={14} />;
  }
}

function windowContextItems(
  window: WindowLayout,
  actions: { recalculate: () => void },
): ContextMenuItem[] {
  switch (window.kind) {
    case "browser":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }];
    case "controls":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }];
    case "table":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }];
    default:
      return [];
  }
}

function HelpWindow() {
  return (
    <div className="h-full overflow-auto bg-white p-4 text-sm text-slate-700">
      <h2 className="text-base font-semibold text-slate-900">UPS-LEIPS Analyzer</h2>
      <div className="mt-3 space-y-2 text-xs leading-5">
        <p>Use the Project menu to create, save, import, export, delete, and list projects.</p>
        <p>View &gt; Reset view restores the workspace pan and zoom to the default state.</p>
        <p>Windows brings an existing window to the front or toggles utility windows.</p>
        <p>On plots, wheel zooms Y, Shift+wheel zooms X, and Alt+drag or Alt+wheel pans.</p>
        <p>Double-click a plot to reset its zoom state.</p>
      </div>
    </div>
  );
}

function SaveAsModal({
  defaultName,
  onCancel,
  onSave,
}: {
  defaultName: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  return (
    <Modal title="Save as ...">
      <label className="block text-xs font-semibold text-slate-600" htmlFor="save-as-name">
        Project name
      </label>
      <input
        id="save-as-name"
        className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <p className="mt-2 text-xs text-slate-500">
        If a saved project has the same name, it will be overwritten.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="rounded bg-slate-950 px-3 py-1 text-xs text-white disabled:bg-slate-400"
          disabled={name.trim().length === 0}
          type="button"
          onClick={() => onSave(name)}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

function DeleteProjectModal({
  projectName,
  onCancel,
  onDelete,
}: {
  projectName: string;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal title="Delete project">
      <p className="text-sm text-slate-700">
        Delete <span className="font-semibold">{projectName}</span> from saved projects?
      </p>
      <p className="mt-2 text-xs text-slate-500">
        The current workspace will return to an empty project.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="rounded bg-red-700 px-3 py-1 text-xs text-white"
          type="button"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

function LoadProjectModal({
  projects,
  onCancel,
  onLoad,
}: {
  projects: ProjectRecord[];
  onCancel: () => void;
  onLoad: (id: string) => void;
}) {
  return (
    <Modal title="Load Project" widthClass="w-[620px]">
      <div className="h-[360px] overflow-hidden rounded border border-slate-200">
        <ProjectTable projects={projects} onLoad={onLoad} />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  widthClass = "w-[360px]",
}: {
  title: string;
  children: ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/30">
      <div className={`${widthClass} rounded border border-slate-300 bg-white p-4 shadow-2xl`}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}
