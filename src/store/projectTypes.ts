import type { AnalysisState, SpectrumDataset } from "../domain/types";
import type { SampleInfoState } from "../domain/sampleInfo";

export interface WindowLayout {
  id: string;
  title: string;
  kind:
    | "browser"
    | "table"
    | "ups"
    | "ups-vb"
    | "ups-ip"
    | "leips"
    | "leips-evac"
    | "reels"
    | "band"
    | "controls"
    | "help"
    | "projects";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  datasetId?: string;
  minimized?: boolean;
}

export interface UiScaleRange {
  min: number;
  max: number;
}

export type CursorStyle = "point" | "range";

export type PlotCursorStyleKey = "upsVb" | "upsIp" | "leips" | "leipsEvac" | "reels";

export interface ProjectUiState {
  bandDiagramViewport?: {
    x?: UiScaleRange;
    y?: UiScaleRange;
    y2?: UiScaleRange;
  };
  reelsPlotViewport?: {
    x?: UiScaleRange;
    y?: UiScaleRange;
    y2?: UiScaleRange;
  };
  upsVbPlotViewport?: {
    x?: UiScaleRange;
    y?: UiScaleRange;
    y2?: UiScaleRange;
  };
  upsIpPlotViewport?: {
    x?: UiScaleRange;
    y?: UiScaleRange;
    y2?: UiScaleRange;
  };
  leipsPlotViewport?: {
    x?: UiScaleRange;
    y?: UiScaleRange;
    y2?: UiScaleRange;
  };
  leipsEvacPlotViewport?: {
    x?: UiScaleRange;
    y?: UiScaleRange;
    y2?: UiScaleRange;
  };
  reelsBackgroundMode?: "fit-range" | "single-point";
  cursorStyles?: Partial<Record<PlotCursorStyleKey, CursorStyle>>;
  sampleInfo?: SampleInfoState;
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  datasets: SpectrumDataset[];
  selectedDatasetId?: string;
  analysis: AnalysisState;
  ui?: ProjectUiState;
  windows: WindowLayout[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord extends ProjectSnapshot {
  savedAt: string;
}

export interface CatalogRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}
