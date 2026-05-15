import {
  calculateLEIPSResult,
  calculateREELSResult,
  assembleUPSResult,
  calculateUPSIPResult,
  createBandDiagram,
} from "./analysis";
import { lineIntersection, linearFit } from "./fit";
import type { AnalysisState, FitRanges, Point, SpectrumDataset } from "./types";

export const DEFAULT_FIT_RANGES: FitRanges = {
  upsVbEdge: { min: 0.9, max: 2.6 },
  upsVbBackground: { min: -3.2, max: -1.0 },
  upsIpVbmEdge: { min: 0.55, max: 1.7 },
  upsIpVbmBackground: { min: -3.4, max: -1.6 },
  upsIpEdge: { min: 9.0, max: 11.4 },
  upsIpBackground: { min: 12.2, max: 15.2 },
  leetDerPeak: { min: -6.9, max: -5.7 },
  leipsEdge: { min: 1.0, max: 2.4 },
  leipsBackground: { min: 3.0, max: 4.6 },
  reelsEdge: { min: 2.8, max: 3.6 },
  reelsBackground: { min: 0.5, max: 1.8 },
};

export function createDemoDatasets(): SpectrumDataset[] {
  return [
    createUpsVbDataset(),
    createUpsIpDataset("demo-ups-ip-minus10", "Demo UPS IP -10V", -10, 0),
    createUpsIpDataset("demo-ups-ip-minus7", "Demo UPS IP -7V", -7, -0.2),
    createUpsIpDataset("demo-ups-ip-minus5", "Demo UPS IP -5V", -5, -0.35),
    createLeetDataset(),
    createLeetDerDataset(),
    createLeipsDataset(),
    createReelsDataset(),
  ];
}

export function createInitialAnalysis(datasets: readonly SpectrumDataset[]): AnalysisState {
  const selection = {
    upsVbDatasetId: findByKind(datasets, "ups-vb")?.id,
    upsIpDatasetIds: datasets
      .filter((dataset) => dataset.kind === "ups-ip")
      .map((dataset) => dataset.id),
    leetDatasetId: findByKind(datasets, "leet")?.id,
    leetDerDatasetId: findByKind(datasets, "leet-der")?.id,
    leipsDatasetId: findByKind(datasets, "leips")?.id,
    reelsDatasetId: findByKind(datasets, "reels")?.id,
  };

  const base = {
    selection,
    fitRanges: DEFAULT_FIT_RANGES,
    bandpassType: 1,
    customBandpassEnergy: 4.77,
    photonEnergy: 21.22,
    reelsIncidentEnergy: 1000,
    efMinusEvbm: 0,
  };

  const vbDataset = findById(datasets, selection.upsVbDatasetId);
  const ipDatasets = selection.upsIpDatasetIds
    .map((id) => findById(datasets, id))
    .filter((dataset): dataset is SpectrumDataset => Boolean(dataset));
  const leetDerDataset = findById(datasets, selection.leetDerDatasetId);
  const leipsDataset = findById(datasets, selection.leipsDatasetId);
  const reelsDataset = findById(datasets, selection.reelsDatasetId);
  if (!vbDataset || ipDatasets.length === 0 || !leetDerDataset || !leipsDataset) {
    return base;
  }

  const vbEdge = linearFit(vbDataset.points, DEFAULT_FIT_RANGES.upsVbEdge);
  const vbBackground = linearFit(vbDataset.points, DEFAULT_FIT_RANGES.upsVbBackground);
  const ups = assembleUPSResult({
    vbEvbm: lineIntersection(vbEdge, vbBackground),
    vbEdge,
    vbBackground,
    ipResults: ipDatasets.map((dataset) =>
      calculateUPSIPResult({
        dataset,
        ranges: {
          ipVbmEdge: DEFAULT_FIT_RANGES.upsIpVbmEdge,
          ipVbmBackground: DEFAULT_FIT_RANGES.upsIpVbmBackground,
          cutoffEdge: DEFAULT_FIT_RANGES.upsIpEdge,
          cutoffBackground: DEFAULT_FIT_RANGES.upsIpBackground,
        },
        appliedVoltage: Number(dataset.metadata.appliedVoltage),
        photonEnergy: 21.22,
      }),
    ),
  });
  const leips = calculateLEIPSResult({
    leetDerDataset,
    leipsDataset,
    peakRange: DEFAULT_FIT_RANGES.leetDerPeak,
    edgeRange: DEFAULT_FIT_RANGES.leipsEdge,
    backgroundRange: DEFAULT_FIT_RANGES.leipsBackground,
    bandpassType: 1,
  });
  const efMinusEvbm = ups.efMinusEvbm;
  const band = createBandDiagram({
    vbDataset,
    leipsEvacPoints: leips.leipsEvacPoints,
    efMinusEvbm,
    ip: ups.ip,
    ea: leips.ea,
  });
  const reels = reelsDataset
    ? calculateREELSResult({
        dataset: reelsDataset,
        edgeRange: DEFAULT_FIT_RANGES.reelsEdge,
        backgroundRange: DEFAULT_FIT_RANGES.reelsBackground,
        incidentEnergy: base.reelsIncidentEnergy,
      })
    : undefined;

  return { ...base, efMinusEvbm, ups, leips, reels, band };
}

function findByKind(
  datasets: readonly SpectrumDataset[],
  kind: SpectrumDataset["kind"],
): SpectrumDataset | undefined {
  return datasets.find((dataset) => dataset.kind === kind);
}

function findById(datasets: readonly SpectrumDataset[], id?: string): SpectrumDataset | undefined {
  return datasets.find((dataset) => dataset.id === id);
}

function createUpsVbDataset(): SpectrumDataset {
  return createDataset(
    "demo-ups-vb",
    "Demo UPS VB",
    "ups-vb",
    range(6, -4, -0.05).map((x) => {
      const edge = 0.42 + 2.9 * (x - 0.56);
      const bg = 0.42;
      const y = x > 0.56 ? edge + ripple(x, 0.12) : bg + ripple(x, 0.04);
      return { x, y: Math.max(0, y) };
    }),
  );
}

function createUpsIpDataset(
  id = "demo-ups-ip",
  name = "Demo UPS IP",
  appliedVoltage = 0,
  shift = 0,
): SpectrumDataset {
  return createDataset(
    id,
    name,
    "ups-ip",
    range(-4, 16, 0.05).map((x) => {
      const ipVbm = 0.56 + shift;
      const cutoff = 11.86 + appliedVoltage * -0.45;
      const vbmEdge = x > ipVbm && x < 4.6 ? 2.3 * (x - ipVbm) : 0;
      const cutoffEdge = x >= cutoff ? 2.4 * (x - cutoff) : 0;
      const y = 0.7 + vbmEdge + cutoffEdge + (x > 8 ? ripple(x, 0.16) : 0);
      return { x, y: Math.max(0, y) };
    }),
    { appliedVoltage: String(appliedVoltage), appliedVoltageSource: "metadata" },
  );
}

function createLeetDataset(): SpectrumDataset {
  return createDataset(
    "demo-leet",
    "Demo LEET",
    "leet",
    range(-9, -1, 0.04).map((x) => {
      const rise = 150 / (1 + Math.exp(-(x + 6.2) * 4));
      const decay = x > -5.2 ? (x + 5.2) * -8 : 0;
      return { x, y: Math.max(0, rise + decay + ripple(x, 1.4)) };
    }),
  );
}

function createLeetDerDataset(): SpectrumDataset {
  return createDataset(
    "demo-leet-der",
    "Demo LEET(der)",
    "leet-der",
    range(-9, -1, 0.04).map((x) => {
      const y = 4 + 102 * Math.exp(-0.5 * ((x + 6.27) / 0.36) ** 2) + ripple(x, 0.9);
      return { x, y };
    }),
  );
}

function createLeipsDataset(): SpectrumDataset {
  const vacuumLevel = -1.5;
  const ea = 3.12;
  return createDataset(
    "demo-leips",
    "Demo LEIPS",
    "leips",
    range(-9, -1, 0.04).map((x) => {
      const energyFromEvac = vacuumLevel - x;
      const onset = Math.max(0, energyFromEvac - ea);
      const y = 0.65 + onset ** 1.7 * 1.1 + ripple(x, 0.35);
      return { x, y: Math.max(0, y) };
    }),
  );
}

function createReelsDataset(): SpectrumDataset {
  const incidentEnergy = 1000;
  const bandGap = 2.65;
  return createDataset(
    "demo-reels",
    "Demo REELS",
    "reels",
    range(989.8, 1004.8, 0.05).map((kineticEnergy) => {
      const loss = incidentEnergy - kineticEnergy;
      const elastic = 260 * Math.exp(-0.5 * ((loss - 0.15) / 0.18) ** 2);
      const onset = loss > bandGap ? (loss - bandGap) ** 1.7 * 120 : 0;
      const baseline = 12 + loss * 0.8;
      return { x: kineticEnergy, y: Math.max(0, elastic + onset + baseline + ripple(loss, 3)) };
    }),
  );
}

function createDataset(
  id: string,
  name: string,
  kind: SpectrumDataset["kind"],
  points: Point[],
  metadata: Record<string, string> = {},
): SpectrumDataset {
  return {
    id,
    name,
    sourceName: `${name}.csv`,
    kind,
    xLabel:
      kind === "leips" || kind === "leet" || kind === "leet-der"
        ? "Applied Bias Vbias / V"
        : kind === "reels"
          ? "Kinetic Energy / eV"
          : "Binding Energy / eV",
    yLabel: "Intensity / a.u.",
    points,
    metadata: { fixture: "synthetic", ...metadata },
  };
}

function range(start: number, end: number, step: number): number[] {
  const values: number[] = [];
  const direction = Math.sign(step);
  for (let value = start; direction > 0 ? value <= end : value >= end; value += step) {
    values.push(Number(value.toFixed(6)));
  }
  return values;
}

function ripple(x: number, amplitude: number): number {
  return amplitude * (Math.sin(x * 7.3) + Math.cos(x * 2.1) * 0.45);
}
