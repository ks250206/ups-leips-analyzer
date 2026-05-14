import { bandpassEnergy, DEFAULT_PHOTON_ENERGY_EV } from "./constants";
import { gaussianFit, lineIntersection, linearFit } from "./fit";
import type {
  BandDiagramResult,
  FitRange,
  LEIPSResult,
  Point,
  SpectrumDataset,
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
}): UPSResult {
  const vbEdge = linearFit(input.vbDataset.points, input.vbEdgeRange);
  const vbBackground = linearFit(input.vbDataset.points, input.vbBackgroundRange);
  const ipVbmEdge = linearFit(input.ipDataset.points, input.ipVbmEdgeRange);
  const ipVbmBackground = linearFit(input.ipDataset.points, input.ipVbmBackgroundRange);
  const cutoffEdge = linearFit(input.ipDataset.points, input.cutoffEdgeRange);
  const cutoffBackground = linearFit(input.ipDataset.points, input.cutoffBackgroundRange);
  const vbEvbm = lineIntersection(vbEdge, vbBackground);
  const ipEvbm = lineIntersection(ipVbmEdge, ipVbmBackground);
  const ecutoff = lineIntersection(cutoffEdge, cutoffBackground);
  const photonEnergy = input.photonEnergy ?? DEFAULT_PHOTON_ENERGY_EV;

  return {
    vbEvbm,
    ipEvbm,
    efMinusEvbm: Math.abs(vbEvbm),
    ecutoff,
    ip: calculateIonizationPotential({ photonEnergy, ecutoff, vbm: ipEvbm }),
    photonEnergy,
    vbEdge,
    vbBackground,
    ipVbmEdge,
    ipVbmBackground,
    cutoffEdge,
    cutoffBackground,
  };
}

export function calculateIonizationPotential(input: {
  photonEnergy: number;
  ecutoff: number;
  vbm: number;
}): number {
  return input.photonEnergy - (input.ecutoff - input.vbm);
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
}): LEIPSResult {
  const peakFit = gaussianFit(input.leetDerDataset.points, input.peakRange);
  const bandpass = bandpassEnergy(input.bandpassType);
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
  const leipsShift = input.efMinusEvbm - input.ip;

  return {
    efMinusEvbm: input.efMinusEvbm,
    ip: input.ip,
    ea: input.ea,
    eg: input.ip - input.ea,
    vacuumRelativeToEf,
    cbmRelativeToEf,
    upsPoints: input.vbDataset.points,
    leipsPoints: input.leipsEvacPoints.map((point) => ({ x: point.x + leipsShift, y: point.y })),
  };
}
