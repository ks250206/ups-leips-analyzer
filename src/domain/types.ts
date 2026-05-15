export type SpectrumKind = "ups-vb" | "ups-ip" | "leet" | "leet-der" | "leips" | "unknown";

export type FitTarget =
  | "ups-vb-edge"
  | "ups-vb-bg"
  | "ups-ip-vbm-edge"
  | "ups-ip-vbm-bg"
  | "ups-ip-edge"
  | "ups-ip-bg"
  | "leips-edge"
  | "leips-bg"
  | "leet-der-peak";

export interface Point {
  x: number;
  y: number;
}

export interface SpectrumDataset {
  id: string;
  name: string;
  sourceName: string;
  kind: SpectrumKind;
  xLabel: string;
  yLabel: string;
  points: Point[];
  metadata: Record<string, string>;
}

export interface FitRange {
  min: number;
  max: number;
}

export interface LineFitResult {
  intercept: number;
  slope: number;
  rSquared: number;
  range: FitRange;
  pointsUsed: number;
}

export interface GaussianFitResult {
  offset: number;
  amplitude: number;
  center: number;
  sigma: number;
  rSquared: number;
  range: FitRange;
  pointsUsed: number;
}

export interface UPSResult {
  vbEvbm: number;
  ipEvbm: number;
  efMinusEvbm: number;
  ecutoff: number;
  ip: number;
  photonEnergy: number;
  vbEdge: LineFitResult;
  vbBackground: LineFitResult;
  ipVbmEdge: LineFitResult;
  ipVbmBackground: LineFitResult;
  cutoffEdge: LineFitResult;
  cutoffBackground: LineFitResult;
}

export interface LEIPSResult {
  ePeak: number;
  bandpassEnergy: number;
  vacuumLevel: number;
  ea: number;
  peakFit: GaussianFitResult;
  leipsEdge: LineFitResult;
  leipsBackground: LineFitResult;
  leipsEvacPoints: Point[];
}

export interface BandDiagramResult {
  efMinusEvbm: number;
  ip: number;
  ea: number;
  eg: number;
  vacuumRelativeToEf: number;
  cbmRelativeToEf: number;
  upsPoints: Point[];
  leipsPoints: Point[];
}

export interface FitRanges {
  upsVbEdge: FitRange;
  upsVbBackground: FitRange;
  upsIpVbmEdge: FitRange;
  upsIpVbmBackground: FitRange;
  upsIpEdge: FitRange;
  upsIpBackground: FitRange;
  leetDerPeak: FitRange;
  leipsEdge: FitRange;
  leipsBackground: FitRange;
}

export interface AnalysisSelection {
  upsVbDatasetId?: string;
  upsIpDatasetId?: string;
  leetDatasetId?: string;
  leetDerDatasetId?: string;
  leipsDatasetId?: string;
}

export interface AnalysisState {
  selection: AnalysisSelection;
  fitRanges: FitRanges;
  bandpassType: number;
  customBandpassEnergy?: number;
  photonEnergy: number;
  efMinusEvbm: number;
  ups?: UPSResult;
  leips?: LEIPSResult;
  band?: BandDiagramResult;
  error?: string;
}
