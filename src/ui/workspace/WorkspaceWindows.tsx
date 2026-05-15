import {
  BarChart3,
  FolderOpen,
  HelpCircle,
  LineChart,
  ListChecks,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AnalysisSelection, SpectrumDataset } from "../../domain/types";
import type { WindowLayout } from "../../store/projectTypes";
import type { ContextMenuItem } from "../ContextMenu";
import { AnalysisControls } from "../windows/AnalysisControls";
import { BandDiagramWindow } from "../windows/BandDiagramWindow";
import { DataBrowser } from "../windows/DataBrowser";
import { DataTable } from "../windows/DataTable";
import { LEIPSEvacPlotWindow, LEIPSPlotWindow } from "../windows/LEIPSPlotWindow";
import { ProjectListWindow } from "../windows/ProjectListWindow";
import { UPSIPPlotWindow, UPSVBPlotWindow } from "../windows/UPSPlotWindow";

export function renderWindow(window: WindowLayout) {
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

export function iconForWindow(kind: WindowLayout["kind"]): ReactNode {
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

export function titleForWindow(
  window: WindowLayout,
  datasets: readonly SpectrumDataset[],
  selection: AnalysisSelection,
): string {
  switch (window.kind) {
    case "ups-vb":
      return appendDatasetName(window.title, datasets, selection.upsVbDatasetId);
    case "ups-ip":
    case "ups":
      return appendDatasetName(window.title, datasets, selection.upsIpDatasetId);
    case "leips":
    case "leips-evac":
      return appendDatasetName(window.title, datasets, selection.leipsDatasetId);
    default:
      return window.title;
  }
}

export function windowContextItems(
  window: WindowLayout,
  actions: {
    assignDataset: (slot: keyof AnalysisSelection, datasetId: string) => void;
    datasets: readonly SpectrumDataset[];
    recalculate: () => void;
    selection: AnalysisSelection;
  },
): ContextMenuItem[] {
  switch (window.kind) {
    case "browser":
    case "controls":
    case "table":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }];
    case "ups-vb":
      return [
        datasetSubmenu("UPS VB dataset", "upsVbDatasetId", "ups-vb", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
      ];
    case "ups":
    case "ups-ip":
      return [
        datasetSubmenu("UPS IP dataset", "upsIpDatasetId", "ups-ip", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
      ];
    case "leips":
      return [
        datasetSubmenu("LEET dataset", "leetDatasetId", "leet", actions),
        datasetSubmenu("LEET(der) dataset", "leetDerDatasetId", "leet-der", actions),
        datasetSubmenu("LEIPS dataset", "leipsDatasetId", "leips", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
      ];
    case "leips-evac":
      return [
        datasetSubmenu("LEIPS dataset", "leipsDatasetId", "leips", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
      ];
    default:
      return [];
  }
}

function appendDatasetName(
  title: string,
  datasets: readonly SpectrumDataset[],
  datasetId: string | undefined,
): string {
  const datasetName = datasets.find((dataset) => dataset.id === datasetId)?.name;
  return datasetName ? `${title} - ${datasetName}` : title;
}

function datasetSubmenu(
  label: string,
  slot: keyof AnalysisSelection,
  kind: SpectrumDataset["kind"],
  actions: {
    assignDataset: (slot: keyof AnalysisSelection, datasetId: string) => void;
    datasets: readonly SpectrumDataset[];
    selection: AnalysisSelection;
  },
): ContextMenuItem {
  const datasets = actions.datasets.filter((dataset) => dataset.kind === kind);
  return {
    type: "submenu",
    label,
    items:
      datasets.length > 0
        ? datasets.map((dataset) => ({
            type: "item",
            label: dataset.id === actions.selection[slot] ? `${dataset.name} ✓` : dataset.name,
            action: () => actions.assignDataset(slot, dataset.id),
          }))
        : [{ type: "item", label: "No matching datasets", disabled: true }],
  };
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
