import { beforeEach, describe, expect, test } from "vite-plus/test";
import { createDemoDatasets } from "../domain/demoData";
import type { FitTarget } from "../domain/types";
import { exportProjectJson } from "./projectDb";
import { fitRangeKey, useProjectStore } from "./projectStore";

const TARGETS: FitTarget[] = [
  "ups-vb-edge",
  "ups-vb-bg",
  "ups-ip-vbm-edge",
  "ups-ip-vbm-bg",
  "ups-ip-edge",
  "ups-ip-bg",
  "leet-der-peak",
  "leips-edge",
  "leips-bg",
];

describe("project store", () => {
  beforeEach(() => {
    useProjectStore.getState().loadDemo();
  });

  test("starts with no datasets and loads demo datasets only on request", () => {
    useProjectStore.setState({ project: useProjectStore.getInitialState().project });
    expect(useProjectStore.getState().project.datasets).toHaveLength(0);
    expect(useProjectStore.getState().project.analysis.ups).toBeUndefined();

    useProjectStore.getState().loadDemo();

    expect(useProjectStore.getState().project.datasets).toHaveLength(5);
    expect(useProjectStore.getState().project.analysis.ups).toBeDefined();
  });

  test("does not run analysis or set errors for an empty project", () => {
    useProjectStore.setState({ project: useProjectStore.getInitialState().project });

    useProjectStore.getState().recalculate();
    const analysis = useProjectStore.getState().project.analysis;

    expect(analysis.error).toBeUndefined();
    expect(analysis.ups).toBeUndefined();
    expect(analysis.leips).toBeUndefined();
    expect(analysis.band).toBeUndefined();
  });

  test("maps every fit target to a fit range key", () => {
    expect(TARGETS.map((target) => fitRangeKey(target))).toEqual([
      "upsVbEdge",
      "upsVbBackground",
      "upsIpVbmEdge",
      "upsIpVbmBackground",
      "upsIpEdge",
      "upsIpBackground",
      "leetDerPeak",
      "leipsEdge",
      "leipsBackground",
    ]);
  });

  test("updates fit ranges and recalculates analysis", () => {
    for (const target of TARGETS) {
      useProjectStore.getState().setFitRange(target, { min: -2, max: -1 });
      expect(useProjectStore.getState().activeFitTarget).toBe(target);
    }
    expect(useProjectStore.getState().project.analysis.error).toBeDefined();
  });

  test("keeps UPS results when LEIPS fitting range is invalid", () => {
    useProjectStore.getState().setFitRange("leips-bg", { min: 100, max: 101 });

    const analysis = useProjectStore.getState().project.analysis;

    expect(analysis.ups).toBeDefined();
    expect(analysis.leips).toBeUndefined();
    expect(analysis.band).toBeUndefined();
    expect(analysis.error).toContain("LEIPS:");
  });

  test("updates dataset selection, bandpass, Ef offset and windows", () => {
    const state = useProjectStore.getState();
    const leips = state.project.datasets.find((dataset) => dataset.kind === "leips")!;
    state.selectDataset(leips.id);
    state.assignDataset("leipsDatasetId", leips.id);
    state.setBandpassType(2);
    state.setEfMinusEvbm(0.7);
    state.updateWindow("browser", { x: 44, y: 55 });
    state.focusWindow("browser");

    const next = useProjectStore.getState().project;
    expect(next.selectedDatasetId).toBe(leips.id);
    expect(next.analysis.bandpassType).toBe(2);
    expect(next.analysis.efMinusEvbm).toBe(next.analysis.ups?.efMinusEvbm);
    expect(next.windows.find((window) => window.id === "browser")?.x).toBe(44);
  });

  test("adds datasets and imports project JSON", () => {
    const incoming = createDemoDatasets().map((dataset) => ({
      ...dataset,
      id: `incoming-${dataset.id}`,
      name: `Incoming ${dataset.name}`,
    }));
    useProjectStore.getState().addDatasets(incoming);
    expect(
      useProjectStore.getState().project.datasets.some((dataset) => dataset.id === incoming[0]?.id),
    ).toBe(true);

    const project = { ...useProjectStore.getState().project, id: "imported", name: "Imported" };
    useProjectStore.getState().importProject(exportProjectJson(project));
    expect(useProjectStore.getState().project.name).toBe("Imported");
  });

  test("switches analysis slots from demo datasets to imported datasets of the same kind", () => {
    const incoming = createDemoDatasets().map((dataset) => ({
      ...dataset,
      id: `loaded-${dataset.id}`,
      name: `Loaded ${dataset.name}`,
    }));

    useProjectStore.getState().addDatasets(incoming);

    expect(
      useProjectStore.getState().project.datasets.some((dataset) => dataset.id === "demo-ups-vb"),
    ).toBe(false);
    const selection = useProjectStore.getState().project.analysis.selection;
    expect(selection.upsVbDatasetId).toBe("loaded-demo-ups-vb");
    expect(selection.upsIpDatasetId).toBe("loaded-demo-ups-ip");
    expect(selection.leetDatasetId).toBe("loaded-demo-leet");
    expect(selection.leetDerDatasetId).toBe("loaded-demo-leet-der");
    expect(selection.leipsDatasetId).toBe("loaded-demo-leips");
  });

  test("initializes LEET derivative peak cursor around the loaded maximum intensity", () => {
    const incoming = createDemoDatasets().map((dataset) =>
      dataset.kind === "leet-der"
        ? {
            ...dataset,
            id: "loaded-shifted-leet-der",
            points: dataset.points.map((point) => ({
              x: point.x,
              y: 5 + 120 * Math.exp(-0.5 * ((point.x + 3.25) / 0.2) ** 2),
            })),
          }
        : { ...dataset, id: `loaded-${dataset.id}` },
    );

    useProjectStore.getState().addDatasets(incoming);

    const range = useProjectStore.getState().project.analysis.fitRanges.leetDerPeak;
    expect(range.min).toBeCloseTo(-3.76, 1);
    expect(range.max).toBeCloseTo(-2.76, 1);
  });

  test("initializes LEIPS edge and background cursors inside the Evac-transformed data", () => {
    const incoming = createDemoDatasets().map((dataset) =>
      dataset.kind === "leips"
        ? {
            ...dataset,
            id: "loaded-narrow-leips",
            points: dataset.points.map((point, index) => {
              const energyFromEvac = (index / (dataset.points.length - 1)) * 2;
              return {
                x: -1.5 - energyFromEvac,
                y: 0.2 + Math.max(0, energyFromEvac - 1.2) ** 2 + point.y * 0.001,
              };
            }),
          }
        : { ...dataset, id: `loaded-${dataset.id}` },
    );

    useProjectStore.getState().addDatasets(incoming);

    const analysis = useProjectStore.getState().project.analysis;
    expect(analysis.error ?? "").not.toContain(
      "LEIPS: Linear fit requires at least two points in the selected range.",
    );
    expect(analysis.leips?.leipsEdge.pointsUsed).toBeGreaterThanOrEqual(2);
    expect(analysis.leips?.leipsBackground.pointsUsed).toBeGreaterThanOrEqual(2);
  });

  test("auto-selects datasets when imported project has no assignments", () => {
    const project = {
      ...useProjectStore.getState().project,
      analysis: {
        ...useProjectStore.getState().project.analysis,
        selection: {},
      },
    };
    useProjectStore.getState().importProject(exportProjectJson(project));
    useProjectStore.getState().addDatasets(createDemoDatasets());
    expect(useProjectStore.getState().project.analysis.selection.upsVbDatasetId).toBeDefined();
    useProjectStore.getState().setActiveFitTarget("leips-bg");
    useProjectStore.getState().recalculate();
    expect(useProjectStore.getState().activeFitTarget).toBe("leips-bg");
  });

  test("saves the current project through the default database", async () => {
    await useProjectStore.getState().saveCurrentProject();
    expect(useProjectStore.getState().project.id).toBe("default-project");
  });
});
