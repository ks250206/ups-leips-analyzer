import {
  Activity,
  BarChart3,
  FolderOpen,
  LineChart,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { exportProjectJson } from "../store/projectDb";
import { useProjectStore } from "../store/projectStore";
import type { ProjectRecord, WindowLayout } from "../store/projectTypes";
import type { ContextMenuItem } from "./ContextMenu";
import { AnalysisControls } from "./windows/AnalysisControls";
import { BandDiagramWindow } from "./windows/BandDiagramWindow";
import { DataBrowser } from "./windows/DataBrowser";
import { DataTable } from "./windows/DataTable";
import { LEIPSEvacPlotWindow, LEIPSPlotWindow } from "./windows/LEIPSPlotWindow";
import { UPSIPPlotWindow, UPSVBPlotWindow } from "./windows/UPSPlotWindow";
import { WindowFrame } from "./windows/WindowFrame";

export function Workspace() {
  const project = useProjectStore((state) => state.project);
  const updateWindow = useProjectStore((state) => state.updateWindow);
  const focusWindow = useProjectStore((state) => state.focusWindow);
  const loadDemo = useProjectStore((state) => state.loadDemo);
  const recalculate = useProjectStore((state) => state.recalculate);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const panStart = useRef<{ x: number; y: number; originX: number; originY: number } | undefined>(
    undefined,
  );
  const windows = useMemo(
    () => [...project.windows].sort((a, b) => a.zIndex - b.zIndex),
    [project.windows],
  );
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
      <TopBar />
      <div
        className="absolute inset-x-0 bottom-0 top-10 cursor-grab overflow-hidden active:cursor-grabbing"
        data-workspace-surface="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
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
              contextMenuItems={windowContextItems(window, { loadDemo, recalculate })}
            >
              {renderWindow(window)}
            </WindowFrame>
          ))}
        </div>
      </div>
    </main>
  );
}

function TopBar() {
  const project = useProjectStore((state) => state.project);
  const recalculate = useProjectStore((state) => state.recalculate);

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex h-10 items-center justify-between border-b border-slate-300 bg-slate-950 px-3 text-sm text-slate-100">
      <div className="flex items-center gap-3">
        <Activity size={16} className="text-cyan-300" />
        <h1 className="font-semibold">UPS-LEIPS Analyzer</h1>
        <ProjectMenu />
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
    </header>
  );
}

function ProjectMenu() {
  const project = useProjectStore((state) => state.project);
  const newProject = useProjectStore((state) => state.newProject);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);
  const saveProjectAs = useProjectStore((state) => state.saveProjectAs);
  const loadSavedProject = useProjectStore((state) => state.loadSavedProject);
  const listRecentProjects = useProjectStore((state) => state.listRecentProjects);
  const importProject = useProjectStore((state) => state.importProject);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [draftName, setDraftName] = useState(project.name);
  const [recentProjects, setRecentProjects] = useState<ProjectRecord[]>([]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    void listRecentProjects().then(setRecentProjects);
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [listRecentProjects, open]);

  function exportProject() {
    const blob = new Blob([exportProjectJson(project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.upsleips.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importProjectFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }
    importProject(await file.text());
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        className="rounded px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        Project
      </button>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".json,application/json"
        onChange={(event) => {
          void importProjectFile(event.currentTarget.files);
          event.currentTarget.value = "";
          setOpen(false);
        }}
      />
      {open ? (
        <div className="absolute left-0 top-full z-[1000] mt-1 min-w-48 rounded border border-slate-700 bg-slate-900 py-1 text-xs text-slate-100 shadow-xl">
          <TopMenuItem
            label="New Project"
            onClick={() => {
              newProject();
              setOpen(false);
            }}
          />
          <TopMenuItem
            label="Save Project"
            onClick={() => {
              void saveCurrentProject();
              setOpen(false);
            }}
          />
          <TopMenuItem
            label="Save as"
            onClick={() => {
              setDraftName(project.name);
              setSaveAsOpen(true);
            }}
          />
          {saveAsOpen ? (
            <form
              className="mx-2 my-1 grid grid-cols-[1fr_auto] gap-1"
              onSubmit={(event) => {
                event.preventDefault();
                void saveProjectAs(draftName);
                setSaveAsOpen(false);
                setOpen(false);
              }}
            >
              <input
                className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 outline-none focus:border-cyan-500"
                aria-label="Save as project name"
                value={draftName}
                onChange={(event) => setDraftName(event.currentTarget.value)}
              />
              <button
                className="rounded border border-cyan-600 px-2 py-1 font-semibold text-cyan-200 hover:bg-slate-800"
                type="submit"
              >
                Save
              </button>
            </form>
          ) : null}
          <div className="group relative">
            <div className="flex cursor-default items-center justify-between px-3 py-1.5 hover:bg-slate-800">
              <span>Recent project</span>
              <span className="text-slate-400">›</span>
            </div>
            <div className="invisible absolute left-full top-0 min-w-56 rounded border border-slate-700 bg-slate-900 py-1 shadow-xl group-hover:visible">
              {recentProjects.length > 0 ? (
                recentProjects.map((record) => (
                  <TopMenuItem
                    key={record.id}
                    label={record.name}
                    onClick={() => {
                      void loadSavedProject(record.id);
                      setOpen(false);
                    }}
                  />
                ))
              ) : (
                <div className="px-3 py-1.5 text-slate-400">No recent projects</div>
              )}
            </div>
          </div>
          <div className="my-1 border-t border-slate-700" />
          <TopMenuItem
            label="Export"
            onClick={() => {
              exportProject();
              setOpen(false);
            }}
          />
          <TopMenuItem label="Import" onClick={() => inputRef.current?.click()} />
        </div>
      ) : null}
    </div>
  );
}

function TopMenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="block w-full px-3 py-1.5 text-left hover:bg-slate-800"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
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
  }
}

function windowContextItems(
  window: WindowLayout,
  actions: { loadDemo: () => void; recalculate: () => void },
): ContextMenuItem[] {
  switch (window.kind) {
    case "browser":
      return [
        { type: "item", label: "Load Demo", action: actions.loadDemo },
        { type: "item", label: "Recalculate", action: actions.recalculate },
      ];
    case "controls":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }];
    case "table":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }];
    default:
      return [];
  }
}
