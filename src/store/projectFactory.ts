import { createDemoDatasets, createInitialAnalysis } from "../domain/demoData";
import type { ProjectSnapshot, WindowLayout } from "./projectTypes";

export function createInitialProject(): ProjectSnapshot {
  return createEmptyProject();
}

export function createEmptyProject(): ProjectSnapshot {
  const now = new Date().toISOString();
  return {
    id: "default-project",
    name: "UPS-LEIPS Project",
    datasets: [],
    selectedDatasetId: undefined,
    analysis: createInitialAnalysis([]),
    ui: {},
    windows: defaultWindows(),
    createdAt: now,
    updatedAt: now,
  };
}

export function createDemoProject(): ProjectSnapshot {
  const datasets = createDemoDatasets();
  const now = new Date().toISOString();
  return {
    id: "default-project",
    name: "UPS-LEIPS Demo",
    datasets,
    selectedDatasetId: datasets[0]?.id,
    analysis: createInitialAnalysis(datasets),
    ui: {},
    windows: defaultWindows(),
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultWindows(): WindowLayout[] {
  return [
    {
      id: "browser",
      title: "Data Browser",
      kind: "browser",
      x: 18,
      y: 26,
      width: 280,
      height: 620,
      zIndex: 5,
    },
    {
      id: "controls",
      title: "UPS_analysis",
      kind: "controls",
      x: 1502,
      y: 26,
      width: 378,
      height: 1062,
      zIndex: 9,
    },
    {
      id: "table",
      title: "Table",
      kind: "table",
      x: 18,
      y: 690,
      width: 280,
      height: 300,
      zIndex: 4,
    },
    {
      id: "ups-vb",
      title: "UPS VB",
      kind: "ups-vb",
      x: 308,
      y: 26,
      width: 560,
      height: 330,
      zIndex: 6,
    },
    {
      id: "ups-ip",
      title: "UPS IP",
      kind: "ups-ip",
      x: 878,
      y: 26,
      width: 560,
      height: 330,
      zIndex: 7,
    },
    {
      id: "leips",
      title: "LEIPS Plot",
      kind: "leips",
      x: 308,
      y: 728,
      width: 560,
      height: 350,
      zIndex: 8,
    },
    {
      id: "leips-evac",
      title: "LEIPS vs Energy from Evac.",
      kind: "leips-evac",
      x: 878,
      y: 728,
      width: 560,
      height: 350,
      zIndex: 9,
    },
    {
      id: "ups-bias",
      title: "UPS Bias Dependence",
      kind: "ups-bias",
      x: 308,
      y: 366,
      width: 1130,
      height: 340,
      zIndex: 12,
    },
    {
      id: "band",
      title: "UPS-LEIPS Band Diagram",
      kind: "band",
      x: 308,
      y: 1090,
      width: 560,
      height: 460,
      zIndex: 10,
    },
    {
      id: "reels",
      title: "REELS Plot",
      kind: "reels",
      x: 878,
      y: 1090,
      width: 560,
      height: 360,
      zIndex: 11,
    },
  ];
}
