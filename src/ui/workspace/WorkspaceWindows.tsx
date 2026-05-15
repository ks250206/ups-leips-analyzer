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
import { REELSPlotWindow } from "../windows/REELSPlotWindow";
import {
  UPSBiasDependenceWindow,
  UPSIPPlotWindow,
  UPSVBPlotWindow,
} from "../windows/UPSPlotWindow";

export type AnalysisControlTab = "data" | "sample" | "ups" | "leips" | "reels" | "band" | "fit";

export function renderWindow(window: WindowLayout, analysisTab: AnalysisControlTab = "sample") {
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
    case "ups-bias":
      return <UPSBiasDependenceWindow />;
    case "leips":
      return <LEIPSPlotWindow />;
    case "leips-evac":
      return <LEIPSEvacPlotWindow />;
    case "reels":
      return <REELSPlotWindow />;
    case "band":
      return <BandDiagramWindow />;
    case "controls":
      return <AnalysisControls activeTab={analysisTab} />;
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
    case "ups-bias":
    case "leips":
    case "leips-evac":
    case "reels":
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
      return appendDatasetNames(window.title, datasets, selection.upsIpDatasetIds);
    case "leips":
    case "leips-evac":
      return appendDatasetName(window.title, datasets, selection.leipsDatasetId);
    case "reels":
      return appendDatasetName(window.title, datasets, selection.reelsDatasetId);
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
    resetWindowPosition: (id: string) => void;
    resetWindowSize: (id: string) => void;
    selection: AnalysisSelection;
  },
): ContextMenuItem[] {
  const resetItems: ContextMenuItem[] = [
    { type: "separator" },
    {
      type: "item",
      label: "Reset window position",
      action: () => actions.resetWindowPosition(window.id),
    },
    {
      type: "item",
      label: "Reset window size",
      action: () => actions.resetWindowSize(window.id),
    },
  ];
  switch (window.kind) {
    case "browser":
    case "controls":
    case "table":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }, ...resetItems];
    case "ups-vb":
      return [
        datasetSubmenu("UPS VB dataset", "upsVbDatasetId", "ups-vb", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    case "ups":
    case "ups-ip":
      return [
        multiDatasetSubmenu("UPS IP datasets", "ups-ip", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    case "ups-bias":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }, ...resetItems];
    case "leips":
      return [
        datasetSubmenu("LEET dataset", "leetDatasetId", "leet", actions),
        datasetSubmenu("LEET(der) dataset", "leetDerDatasetId", "leet-der", actions),
        datasetSubmenu("LEIPS dataset", "leipsDatasetId", "leips", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    case "leips-evac":
      return [
        datasetSubmenu("LEIPS dataset", "leipsDatasetId", "leips", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    case "reels":
      return [
        datasetSubmenu("REELS dataset", "reelsDatasetId", "reels", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    default:
      return resetItems.slice(1);
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

function appendDatasetNames(
  title: string,
  datasets: readonly SpectrumDataset[],
  datasetIds: readonly string[] | undefined,
): string {
  const names = (datasetIds ?? [])
    .map((datasetId) => datasets.find((dataset) => dataset.id === datasetId)?.name)
    .filter(Boolean);
  if (names.length === 0) {
    return title;
  }
  return `${title} - ${names.length === 1 ? names[0] : `${names.length} datasets`}`;
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

function multiDatasetSubmenu(
  label: string,
  kind: SpectrumDataset["kind"],
  actions: {
    assignDataset: (slot: keyof AnalysisSelection, datasetId: string) => void;
    datasets: readonly SpectrumDataset[];
    selection: AnalysisSelection;
  },
): ContextMenuItem {
  const datasets = actions.datasets.filter((dataset) => dataset.kind === kind);
  const selected = new Set(actions.selection.upsIpDatasetIds ?? []);
  return {
    type: "submenu",
    label,
    items:
      datasets.length > 0
        ? datasets.map((dataset) => ({
            type: "item",
            label: selected.has(dataset.id) ? `${dataset.name} ✓` : dataset.name,
            action: () => actions.assignDataset("upsIpDatasetIds", dataset.id),
          }))
        : [{ type: "item", label: "No matching datasets", disabled: true }],
  };
}

function HelpWindow() {
  return (
    <div className="h-full overflow-auto bg-white p-4 text-sm text-slate-700">
      <h2 className="text-base font-semibold text-slate-900">UPS-LEIPS Analyzer</h2>
      <div className="mt-3 space-y-2 text-xs leading-5">
        <p>
          Use the Catalogs menu to switch, import, and export catalogs. Use the Projects menu to
          create, save, import, export, delete, and list projects.
        </p>
        <p>View &gt; Reset view restores the workspace pan and zoom to the default state.</p>
        <p>Windows brings an existing window to the front or toggles utility windows.</p>
        <p>On plots, wheel zooms Y, Shift+wheel zooms X, and Alt+drag or Alt+wheel pans.</p>
        <p>Double-click a plot to reset its zoom state.</p>
      </div>
    </div>
  );
}
