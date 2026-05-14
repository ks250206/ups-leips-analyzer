import { beforeEach, describe, expect, test } from "vite-plus/test";
import { createDemoDatasets } from "../domain/demoData";
import type { FitTarget } from "../domain/types";
import { exportProjectJson } from "./projectDb";
import { fitRangeKey, useProjectStore } from "./projectStore";

const TARGETS: FitTarget[] = [
  "ups-vb-edge",
  "ups-vb-bg",
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

  test("maps every fit target to a fit range key", () => {
    expect(TARGETS.map((target) => fitRangeKey(target))).toEqual([
      "upsVbEdge",
      "upsVbBackground",
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
    expect(next.analysis.efMinusEvbm).toBe(0.7);
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
