import type { AnalysisState, SpectrumDataset } from "../domain/types";

export interface WindowLayout {
  id: string;
  title: string;
  kind: "browser" | "table" | "ups" | "ups-vb" | "ups-ip" | "leips" | "band" | "controls";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  datasetId?: string;
  minimized?: boolean;
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  datasets: SpectrumDataset[];
  selectedDatasetId?: string;
  analysis: AnalysisState;
  windows: WindowLayout[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord extends ProjectSnapshot {
  savedAt: string;
}
