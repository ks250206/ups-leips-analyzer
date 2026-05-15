import { calculateLEIPSResult, calculateUPSResult, createBandDiagram } from "./analysis";
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
};

export function createDemoDatasets(): SpectrumDataset[] {
  return [
    createUpsVbDataset(),
    createUpsIpDataset(),
    createLeetDataset(),
    createLeetDerDataset(),
    createLeipsDataset(),
  ];
}

export function createInitialAnalysis(datasets: readonly SpectrumDataset[]): AnalysisState {
  const selection = {
    upsVbDatasetId: findByKind(datasets, "ups-vb")?.id,
    upsIpDatasetId: findByKind(datasets, "ups-ip")?.id,
    leetDatasetId: findByKind(datasets, "leet")?.id,
    leetDerDatasetId: findByKind(datasets, "leet-der")?.id,
    leipsDatasetId: findByKind(datasets, "leips")?.id,
  };

  const base = {
    selection,
    fitRanges: DEFAULT_FIT_RANGES,
    bandpassType: 1,
    customBandpassEnergy: 4.77,
    photonEnergy: 21.22,
    efMinusEvbm: 0.56,
  };

  const vbDataset = findById(datasets, selection.upsVbDatasetId);
  const ipDataset = findById(datasets, selection.upsIpDatasetId);
  const leetDerDataset = findById(datasets, selection.leetDerDatasetId);
  const leipsDataset = findById(datasets, selection.leipsDatasetId);
  if (!vbDataset || !ipDataset || !leetDerDataset || !leipsDataset) {
    return base;
  }

  const ups = calculateUPSResult({
    vbDataset,
    ipDataset,
    vbEdgeRange: DEFAULT_FIT_RANGES.upsVbEdge,
    vbBackgroundRange: DEFAULT_FIT_RANGES.upsVbBackground,
    ipVbmEdgeRange: DEFAULT_FIT_RANGES.upsIpVbmEdge,
    ipVbmBackgroundRange: DEFAULT_FIT_RANGES.upsIpVbmBackground,
    cutoffEdgeRange: DEFAULT_FIT_RANGES.upsIpEdge,
    cutoffBackgroundRange: DEFAULT_FIT_RANGES.upsIpBackground,
    photonEnergy: 21.22,
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

  return { ...base, efMinusEvbm, ups, leips, band };
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

function createUpsIpDataset(): SpectrumDataset {
  return createDataset(
    "demo-ups-ip",
    "Demo UPS IP",
    "ups-ip",
    range(-4, 16, 0.05).map((x) => {
      const vbmEdge = x > 0.56 && x < 4.6 ? 2.3 * (x - 0.56) : 0;
      const cutoffEdge = x >= 11.86 ? 2.4 * (x - 11.86) : 0;
      const y = 0.7 + vbmEdge + cutoffEdge + (x > 8 ? ripple(x, 0.16) : 0);
      return { x, y: Math.max(0, y) };
    }),
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

function createDataset(
  id: string,
  name: string,
  kind: SpectrumDataset["kind"],
  points: Point[],
): SpectrumDataset {
  return {
    id,
    name,
    sourceName: `${name}.csv`,
    kind,
    xLabel:
      kind === "leips" || kind === "leet" || kind === "leet-der"
        ? "Applied Bias Vbias / V"
        : "Binding Energy / eV",
    yLabel: "Intensity / a.u.",
    points,
    metadata: { fixture: "synthetic" },
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
