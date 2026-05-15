export type SpectrumKind =
  | "ups-vb"
  | "ups-ip"
  | "leet"
  | "leet-der"
  | "leips"
  | "reels"
  | "unknown";

export type FitTarget =
  | "ups-vb-edge"
  | "ups-vb-bg"
  | "ups-ip-vbm-edge"
  | "ups-ip-vbm-bg"
  | "ups-ip-edge"
  | "ups-ip-bg"
  | "leips-edge"
  | "leips-bg"
  | "leet-der-peak"
  | "reels-edge"
  | "reels-bg";

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

export interface UPSIPResult {
  datasetId: string;
  datasetName: string;
  appliedVoltage: number;
  ipEvbm: number;
  ecutoff: number;
  ip: number;
  photonEnergy: number;
  ipVbmEdge: LineFitResult;
  ipVbmBackground: LineFitResult;
  cutoffEdge: LineFitResult;
  cutoffBackground: LineFitResult;
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
  ipResults: UPSIPResult[];
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

export interface REELSResult {
  bandGap: number;
  incidentEnergy: number;
  edgeFit: LineFitResult;
  backgroundFit: LineFitResult;
  lossPoints: Point[];
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
  reelsEdge: FitRange;
  reelsBackground: FitRange;
}

export interface UPSIPFitRanges {
  ipVbmEdge: FitRange;
  ipVbmBackground: FitRange;
  cutoffEdge: FitRange;
  cutoffBackground: FitRange;
}

export interface UPSIPConfig {
  appliedVoltage: number;
}

export type BandIpSource =
  | { mode: "zero-voltage-extrapolated" }
  | { mode: "dataset"; datasetId?: string }
  | { mode: "average" };

export interface AnalysisSelection {
  upsVbDatasetId?: string;
  upsIpDatasetIds?: string[];
  /** @deprecated migrated to upsIpDatasetIds */
  upsIpDatasetId?: string;
  leetDatasetId?: string;
  leetDerDatasetId?: string;
  leipsDatasetId?: string;
  reelsDatasetId?: string;
}

export interface AnalysisState {
  selection: AnalysisSelection;
  fitRanges: FitRanges;
  upsIpFitRangesByDatasetId?: Record<string, UPSIPFitRanges>;
  upsIpConfigsByDatasetId?: Record<string, UPSIPConfig>;
  bandIpSource?: BandIpSource;
  bandpassType: number;
  customBandpassEnergy?: number;
  photonEnergy: number;
  reelsIncidentEnergy: number;
  efMinusEvbm: number;
  ups?: UPSResult;
  leips?: LEIPSResult;
  reels?: REELSResult;
  band?: BandDiagramResult;
  error?: string;
}
