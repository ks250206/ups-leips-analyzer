import { beforeEach, describe, expect, test } from "vite-plus/test";
import { createDemoDatasets } from "../domain/demoData";
import { exportProjectJson } from "./projectDb";
import { useProjectStore } from "./projectStore";
import { prefixedDemoDatasets, resetProjectStoreWithDemo } from "./projectStoreTestUtils";

describe("project store dataset selection", () => {
  beforeEach(() => {
    resetProjectStoreWithDemo();
  });

  test("starts with no datasets and loads demo datasets only on request", () => {
    useProjectStore.setState({ project: useProjectStore.getInitialState().project });
    expect(useProjectStore.getState().project.datasets).toHaveLength(0);
    expect(useProjectStore.getState().project.analysis.ups).toBeUndefined();

    useProjectStore.getState().loadDemo();

    expect(useProjectStore.getState().project.datasets).toHaveLength(8);
    expect(useProjectStore.getState().project.analysis.ups).toBeDefined();
    expect(useProjectStore.getState().project.analysis.ups?.ipResults).toHaveLength(3);
    expect(useProjectStore.getState().project.analysis.reels).toBeDefined();
  });

  test("selects multiple UPS IP datasets explicitly", () => {
    const ipIds = useProjectStore
      .getState()
      .project.datasets.filter((dataset) => dataset.kind === "ups-ip")
      .map((dataset) => dataset.id);

    useProjectStore.getState().assignUpsIpDatasets(ipIds.slice(0, 2));

    const analysis = useProjectStore.getState().project.analysis;
    expect(analysis.selection.upsIpDatasetIds).toEqual(ipIds.slice(0, 2));
    expect(analysis.ups?.ipResults.map((result) => result.datasetId)).toEqual(ipIds.slice(0, 2));
  });

  test("toggles UPS IP dataset selection through the generic assignment action", () => {
    const first = useProjectStore.getState().project.analysis.selection.upsIpDatasetIds?.[0];
    expect(first).toBeDefined();

    useProjectStore.getState().assignDataset("upsIpDatasetIds", first!);

    expect(useProjectStore.getState().project.analysis.selection.upsIpDatasetIds).not.toContain(
      first,
    );
  });

  test("adds datasets and imports project JSON", () => {
    const incoming = prefixedDemoDatasets("incoming");
    useProjectStore.getState().addDatasets(incoming);
    expect(
      useProjectStore.getState().project.datasets.some((dataset) => dataset.id === incoming[0]?.id),
    ).toBe(true);

    const project = { ...useProjectStore.getState().project, id: "imported", name: "Imported" };
    useProjectStore.getState().importProject(exportProjectJson(project));
    expect(useProjectStore.getState().project.name).toBe("Imported");
  });

  test("deletes a dataset and repairs selection state", () => {
    const state = useProjectStore.getState();
    const selectedId = state.project.analysis.selection.upsVbDatasetId!;

    state.deleteDataset(selectedId);

    const project = useProjectStore.getState().project;
    expect(project.datasets.some((dataset) => dataset.id === selectedId)).toBe(false);
    expect(project.selectedDatasetId).not.toBe(selectedId);
    expect(project.analysis.selection.upsVbDatasetId).toBeUndefined();
    expect(project.analysis.ups).toBeUndefined();
  });

  test("changes dataset kind without assigning it to an analysis slot", () => {
    const state = useProjectStore.getState();
    const leips = state.project.datasets.find((dataset) => dataset.kind === "leips")!;

    state.setDatasetKind(leips.id, "reels");

    const project = useProjectStore.getState().project;
    const changed = project.datasets.find((dataset) => dataset.id === leips.id)!;
    expect(changed.kind).toBe("reels");
    expect(changed.xLabel).toBe("Kinetic Energy / eV");
    expect(project.analysis.selection.reelsDatasetId).not.toBe(leips.id);
    expect(project.analysis.selection.leipsDatasetId).toBeUndefined();
  });

  test("switches analysis slots from demo datasets to imported datasets of the same kind", () => {
    const incoming = prefixedDemoDatasets("loaded");

    useProjectStore.getState().addDatasets(incoming);

    expect(
      useProjectStore.getState().project.datasets.some((dataset) => dataset.id === "demo-ups-vb"),
    ).toBe(false);
    const selection = useProjectStore.getState().project.analysis.selection;
    expect(selection.upsVbDatasetId).toBe("loaded-demo-ups-vb");
    expect(selection.upsIpDatasetIds).toEqual([
      "loaded-demo-ups-ip-minus10",
      "loaded-demo-ups-ip-minus7",
      "loaded-demo-ups-ip-minus5",
    ]);
    expect(selection.leetDatasetId).toBe("loaded-demo-leet");
    expect(selection.leetDerDatasetId).toBe("loaded-demo-leet-der");
    expect(selection.leipsDatasetId).toBe("loaded-demo-leips");
    expect(selection.reelsDatasetId).toBe("loaded-demo-reels");
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
    expect(useProjectStore.getState().project.analysis.selection.reelsDatasetId).toBeDefined();
    useProjectStore.getState().setActiveFitTarget("leips-bg");
    useProjectStore.getState().recalculate();
    expect(useProjectStore.getState().activeFitTarget).toBe("leips-bg");
  });
});
