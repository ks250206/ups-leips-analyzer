import {
  Activity,
  BarChart3,
  FolderOpen,
  LineChart,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { useProjectStore } from "../store/projectStore";
import type { WindowLayout } from "../store/projectTypes";
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
    <main className="h-screen w-screen overflow-hidden bg-[#d9e4e7] text-slate-900">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(20,47,61,0.16)_1px,transparent_0)] bg-[length:18px_18px]"
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
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex h-10 items-center justify-between border-b border-slate-300 bg-slate-950 px-3 text-sm text-slate-100">
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-cyan-300" />
        <span className="font-semibold">UPS-LEIPS Analyzer</span>
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
        <button
          className="rounded border border-cyan-500 bg-cyan-500 px-2 py-1 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
          type="button"
          onClick={() => void saveCurrentProject()}
        >
          Save Project
        </button>
      </div>
    </header>
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
