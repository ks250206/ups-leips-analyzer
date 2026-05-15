import { describe, expect, test } from "vite-plus/test";
import { bandpassEnergy, DEFAULT_PHOTON_ENERGY_EV } from "./constants";
import {
  calculateIonizationPotential,
  calculateLEIPSResult,
  calculateREELSResult,
  calculateUPSResult,
  convertBiasToVacuumEnergy,
  convertKineticToLoss,
  convertLeipsEvacToEfEnergy,
  createBandDiagram,
} from "./analysis";
import { createDemoDatasets, DEFAULT_FIT_RANGES } from "./demoData";

describe("UPS analysis", () => {
  test("uses the default photon energy constant", () => {
    expect(DEFAULT_PHOTON_ENERGY_EV).toBe(21.22);
  });

  test("uses the IGOR ionization potential formula", () => {
    expect(
      calculateIonizationPotential({ photonEnergy: 21.22, ecutoff: 11.86, vbm: 0.56 }),
    ).toBeCloseTo(9.92, 6);
  });

  test("calculates VBM, cut-off and IP from demo spectra", () => {
    const datasets = createDemoDatasets();
    const result = calculateUPSResult({
      vbDataset: datasets.find((dataset) => dataset.kind === "ups-vb")!,
      ipDataset: datasets.find((dataset) => dataset.kind === "ups-ip")!,
      vbEdgeRange: DEFAULT_FIT_RANGES.upsVbEdge,
      vbBackgroundRange: DEFAULT_FIT_RANGES.upsVbBackground,
      ipVbmEdgeRange: DEFAULT_FIT_RANGES.upsIpVbmEdge,
      ipVbmBackgroundRange: DEFAULT_FIT_RANGES.upsIpVbmBackground,
      cutoffEdgeRange: DEFAULT_FIT_RANGES.upsIpEdge,
      cutoffBackgroundRange: DEFAULT_FIT_RANGES.upsIpBackground,
    });
    expect(result.vbEvbm).toBeCloseTo(0.56, 1);
    expect(result.efMinusEvbm).toBeCloseTo(0.56, 1);
    expect(result.ipEvbm).toBeCloseTo(0.56, 1);
    expect(result.ecutoff).toBeCloseTo(11.86, 1);
    expect(result.ip).toBeGreaterThan(8);
  });
});

describe("REELS analysis", () => {
  test("converts kinetic energy to electron loss energy", () => {
    const point = convertKineticToLoss([{ x: 989.78, y: 1 }], 1000)[0];
    expect(point?.x).toBeCloseTo(10.22, 6);
    expect(point?.y).toBe(1);
  });

  test("calculates REELS band gap from onset and background fits on loss axis", () => {
    const datasets = createDemoDatasets();
    const result = calculateREELSResult({
      dataset: datasets.find((dataset) => dataset.kind === "reels")!,
      edgeRange: DEFAULT_FIT_RANGES.reelsEdge,
      backgroundRange: DEFAULT_FIT_RANGES.reelsBackground,
    });

    expect(result.incidentEnergy).toBe(1000);
    expect(result.lossPoints[0]?.x).toBeLessThan(result.lossPoints.at(-1)?.x ?? 0);
    expect(result.edgeFit.pointsUsed).toBeGreaterThanOrEqual(2);
    expect(result.backgroundFit.pointsUsed).toBeGreaterThanOrEqual(2);
    expect(result.bandGap).toBeCloseTo(2.65, 1);
  });
});

describe("LEIPS analysis", () => {
  test("resolves and validates bandpass energy", () => {
    expect(bandpassEnergy(1)).toBe(4.77);
    expect(() => bandpassEnergy(99)).toThrow("Unknown bandpass");
  });

  test("converts applied bias to vacuum-level energy", () => {
    expect(convertBiasToVacuumEnergy([{ x: -4.5, y: 1 }], -1.5)[0]).toEqual({ x: 3, y: 1 });
  });

  test("calculates vacuum level and EA from demo spectra", () => {
    const datasets = createDemoDatasets();
    const result = calculateLEIPSResult({
      leetDerDataset: datasets.find((dataset) => dataset.kind === "leet-der")!,
      leipsDataset: datasets.find((dataset) => dataset.kind === "leips")!,
      peakRange: DEFAULT_FIT_RANGES.leetDerPeak,
      edgeRange: DEFAULT_FIT_RANGES.leipsEdge,
      backgroundRange: DEFAULT_FIT_RANGES.leipsBackground,
      bandpassType: 1,
    });
    expect(result.ePeak).toBeCloseTo(-6.27, 1);
    expect(result.vacuumLevel).toBeCloseTo(-1.5, 1);
    expect(result.ea).toBeGreaterThan(2);
  });

  test("creates UPS-LEIPS band diagram coordinates", () => {
    const datasets = createDemoDatasets();
    const vbDataset = datasets.find((dataset) => dataset.kind === "ups-vb")!;
    const band = createBandDiagram({
      vbDataset,
      leipsEvacPoints: [{ x: 3.12, y: 1 }],
      efMinusEvbm: 0.56,
      ip: 5.9,
      ea: 3.12,
    });
    expect(band.eg).toBeCloseTo(2.78, 6);
    expect(band.vacuumRelativeToEf).toBeCloseTo(-5.34, 6);
    expect(band.cbmRelativeToEf).toBeCloseTo(-2.22, 6);
    expect(band.leipsPoints[0]?.x).toBeCloseTo(-2.22, 6);
  });

  test("converts LEIPS energy from Evac to energy relative to Ef using the IGOR shift", () => {
    const shifted = convertLeipsEvacToEfEnergy(
      [
        { x: 3.12, y: 1 },
        { x: 5.5, y: 2 },
      ],
      { efMinusEvbm: 0.56, ip: 5.9 },
    );

    expect(shifted[0]?.x).toBeCloseTo(-2.22, 6);
    expect(shifted[0]?.y).toBe(1);
    expect(shifted[1]?.x).toBeCloseTo(0.16, 6);
    expect(shifted[1]?.y).toBe(2);
  });
});
