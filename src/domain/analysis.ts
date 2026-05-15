import { bandpassEnergy, DEFAULT_PHOTON_ENERGY_EV } from "./constants";
import { gaussianFit, lineIntersection, linearFit } from "./fit";
import type {
  BandDiagramResult,
  FitRange,
  LEIPSResult,
  LineFitResult,
  Point,
  REELSResult,
  SpectrumDataset,
  UPSIPFitRanges,
  UPSIPResult,
  UPSResult,
} from "./types";

export function calculateUPSResult(input: {
  vbDataset: SpectrumDataset;
  ipDataset: SpectrumDataset;
  vbEdgeRange: FitRange;
  vbBackgroundRange: FitRange;
  ipVbmEdgeRange: FitRange;
  ipVbmBackgroundRange: FitRange;
  cutoffEdgeRange: FitRange;
  cutoffBackgroundRange: FitRange;
  photonEnergy?: number;
  appliedVoltage?: number;
}): UPSResult {
  const vbEdge = linearFit(input.vbDataset.points, input.vbEdgeRange);
  const vbBackground = linearFit(input.vbDataset.points, input.vbBackgroundRange);
  const vbEvbm = lineIntersection(vbEdge, vbBackground);
  const ipResult = calculateUPSIPResult({
    dataset: input.ipDataset,
    ranges: {
      ipVbmEdge: input.ipVbmEdgeRange,
      ipVbmBackground: input.ipVbmBackgroundRange,
      cutoffEdge: input.cutoffEdgeRange,
      cutoffBackground: input.cutoffBackgroundRange,
    },
    photonEnergy: input.photonEnergy,
    appliedVoltage: input.appliedVoltage,
  });

  return assembleUPSResult({
    vbEvbm,
    vbEdge,
    vbBackground,
    ipResults: [ipResult],
  });
}

export function calculateUPSIPResult(input: {
  dataset: SpectrumDataset;
  ranges: UPSIPFitRanges;
  photonEnergy?: number;
  appliedVoltage?: number;
}): UPSIPResult {
  const ipVbmEdge = linearFit(input.dataset.points, input.ranges.ipVbmEdge);
  const ipVbmBackground = linearFit(input.dataset.points, input.ranges.ipVbmBackground);
  const cutoffEdge = linearFit(input.dataset.points, input.ranges.cutoffEdge);
  const cutoffBackground = linearFit(input.dataset.points, input.ranges.cutoffBackground);
  const ipEvbm = lineIntersection(ipVbmEdge, ipVbmBackground);
  const ecutoff = lineIntersection(cutoffEdge, cutoffBackground);
  const photonEnergy = input.photonEnergy ?? DEFAULT_PHOTON_ENERGY_EV;

  return {
    datasetId: input.dataset.id,
    datasetName: input.dataset.name,
    appliedVoltage: input.appliedVoltage ?? 0,
    ipEvbm,
    ecutoff,
    ip: calculateIonizationPotential({ photonEnergy, ecutoff, vbm: ipEvbm }),
    photonEnergy,
    ipVbmEdge,
    ipVbmBackground,
    cutoffEdge,
    cutoffBackground,
  };
}

export function assembleUPSResult(input: {
  vbEvbm: number;
  vbEdge: UPSResult["vbEdge"];
  vbBackground: UPSResult["vbBackground"];
  ipResults: UPSIPResult[];
}): UPSResult {
  const primary = input.ipResults[0];
  return {
    vbEvbm: input.vbEvbm,
    ipEvbm: primary?.ipEvbm ?? Number.NaN,
    efMinusEvbm: Math.abs(input.vbEvbm),
    ecutoff: primary?.ecutoff ?? Number.NaN,
    ip: primary?.ip ?? Number.NaN,
    photonEnergy: primary?.photonEnergy ?? DEFAULT_PHOTON_ENERGY_EV,
    vbEdge: input.vbEdge,
    vbBackground: input.vbBackground,
    ipVbmEdge: primary?.ipVbmEdge ?? emptyLineFit(),
    ipVbmBackground: primary?.ipVbmBackground ?? emptyLineFit(),
    cutoffEdge: primary?.cutoffEdge ?? emptyLineFit(),
    cutoffBackground: primary?.cutoffBackground ?? emptyLineFit(),
    ipResults: input.ipResults,
  };
}

function emptyLineFit(): UPSResult["vbEdge"] {
  return {
    intercept: Number.NaN,
    slope: Number.NaN,
    rSquared: Number.NaN,
    range: { min: Number.NaN, max: Number.NaN },
    pointsUsed: 0,
  };
}

export function calculateIonizationPotential(input: {
  photonEnergy: number;
  ecutoff: number;
  vbm: number;
}): number {
  return input.photonEnergy - (input.ecutoff - input.vbm);
}

export interface BiasDependenceResult {
  slope: number;
  intercept: number;
  rSquared: number;
  pointsUsed: number;
  valueAtZero: number;
}

export function calculateBiasDependence(
  points: readonly { voltage: number; value: number }[],
): BiasDependenceResult | undefined {
  const fitPoints = points
    .filter((point) => Number.isFinite(point.voltage) && Number.isFinite(point.value))
    .map((point) => ({ x: point.voltage, y: point.value }));
  if (fitPoints.length < 2) {
    return undefined;
  }
  const fit = linearFit(fitPoints, {
    min: Math.min(...fitPoints.map((point) => point.x)),
    max: Math.max(...fitPoints.map((point) => point.x)),
  });
  return {
    slope: fit.slope,
    intercept: fit.intercept,
    rSquared: fit.rSquared,
    pointsUsed: fit.pointsUsed,
    valueAtZero: fit.intercept,
  };
}

export function convertBiasToVacuumEnergy(points: readonly Point[], vacuumLevel: number): Point[] {
  return points.map((point) => ({ x: vacuumLevel - point.x, y: point.y }));
}

export function calculateLEIPSResult(input: {
  leetDerDataset: SpectrumDataset;
  leipsDataset: SpectrumDataset;
  peakRange: FitRange;
  edgeRange: FitRange;
  backgroundRange: FitRange;
  bandpassType: number;
  bandpassEnergyEv?: number;
}): LEIPSResult {
  const peakFit = gaussianFit(input.leetDerDataset.points, input.peakRange);
  const bandpass = input.bandpassEnergyEv ?? bandpassEnergy(input.bandpassType);
  const vacuumLevel = peakFit.center + bandpass;
  const leipsEvacPoints = convertBiasToVacuumEnergy(input.leipsDataset.points, vacuumLevel);
  const leipsEdge = linearFit(leipsEvacPoints, input.edgeRange);
  const leipsBackground = linearFit(leipsEvacPoints, input.backgroundRange);
  const ea = lineIntersection(leipsEdge, leipsBackground);

  return {
    ePeak: peakFit.center,
    bandpassEnergy: bandpass,
    vacuumLevel,
    ea,
    peakFit,
    leipsEdge,
    leipsBackground,
    leipsEvacPoints,
  };
}

export function createBandDiagram(input: {
  vbDataset: SpectrumDataset;
  leipsEvacPoints: readonly Point[];
  efMinusEvbm: number;
  ip: number;
  ea: number;
}): BandDiagramResult {
  const vacuumRelativeToEf = input.efMinusEvbm - input.ip;
  const cbmRelativeToEf = vacuumRelativeToEf + input.ea;

  return {
    efMinusEvbm: input.efMinusEvbm,
    ip: input.ip,
    ea: input.ea,
    eg: input.ip - input.ea,
    vacuumRelativeToEf,
    cbmRelativeToEf,
    upsPoints: input.vbDataset.points,
    leipsPoints: convertLeipsEvacToEfEnergy(input.leipsEvacPoints, {
      efMinusEvbm: input.efMinusEvbm,
      ip: input.ip,
    }),
  };
}

export function convertLeipsEvacToEfEnergy(
  points: readonly Point[],
  input: { efMinusEvbm: number; ip: number },
): Point[] {
  const vacuumRelativeToEf = input.efMinusEvbm - input.ip;
  return points.map((point) => ({ x: point.x + vacuumRelativeToEf, y: point.y }));
}

export function convertKineticToLoss(points: readonly Point[], incidentEnergy = 1000): Point[] {
  return points
    .map((point) => ({ x: incidentEnergy - point.x, y: point.y }))
    .sort((left, right) => left.x - right.x);
}

export function calculateREELSResult(input: {
  dataset: SpectrumDataset;
  edgeRange: FitRange;
  backgroundRange: FitRange;
  incidentEnergy?: number;
  backgroundMode?: "fit-range" | "single-point";
}): REELSResult {
  const incidentEnergy = input.incidentEnergy ?? 1000;
  const lossPoints = convertKineticToLoss(input.dataset.points, incidentEnergy);
  const edgeFit = linearFit(lossPoints, input.edgeRange);
  const backgroundFit =
    input.backgroundMode === "single-point"
      ? horizontalFitAtRangeCenter(lossPoints, input.backgroundRange)
      : linearFit(lossPoints, input.backgroundRange);
  const bandGap = lineIntersection(edgeFit, backgroundFit);

  return {
    bandGap,
    incidentEnergy,
    edgeFit,
    backgroundFit,
    lossPoints,
  };
}

function horizontalFitAtRangeCenter(points: readonly Point[], range: FitRange): LineFitResult {
  const x = (range.min + range.max) / 2;
  const y = interpolatePointY(points, x);
  return {
    intercept: y,
    slope: 0,
    rSquared: 1,
    range,
    pointsUsed: 1,
  };
}

function interpolatePointY(points: readonly Point[], x: number): number {
  if (points.length === 0) {
    return 0;
  }
  const sorted = [...points].sort((left, right) => left.x - right.x);
  if (x <= (sorted[0]?.x ?? x)) {
    return sorted[0]?.y ?? 0;
  }
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous || !current) {
      continue;
    }
    if (x >= previous.x && x <= current.x) {
      const span = current.x - previous.x;
      return span === 0
        ? current.y
        : previous.y + ((x - previous.x) / span) * (current.y - previous.y);
    }
  }
  return sorted.at(-1)?.y ?? 0;
}
