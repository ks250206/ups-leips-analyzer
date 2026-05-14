import { describe, expect, test } from "vite-plus/test";
import { bandpassEnergy, DEFAULT_PHOTON_ENERGY_EV } from "./constants";
import {
  calculateIonizationPotential,
  calculateLEIPSResult,
  calculateUPSResult,
  convertBiasToVacuumEnergy,
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
      cutoffEdgeRange: DEFAULT_FIT_RANGES.upsIpEdge,
      cutoffBackgroundRange: DEFAULT_FIT_RANGES.upsIpBackground,
    });
    expect(result.vbm).toBeCloseTo(0.56, 1);
    expect(result.ecutoff).toBeCloseTo(11.86, 1);
    expect(result.ip).toBeGreaterThan(8);
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
    expect(band.leipsPoints[0]?.x).toBeCloseTo(-2.22, 6);
  });
});
