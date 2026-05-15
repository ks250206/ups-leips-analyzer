import { beforeEach, describe, expect, test } from "vite-plus/test";
import { createDemoDatasets } from "../domain/demoData";
import type { FitTarget } from "../domain/types";
import { DEFAULT_CATALOG_ID, DEFAULT_CATALOG_NAME, exportProjectJson } from "./projectDb";
import {
  LAST_OPENED_WORKSPACE_KEY,
  clearLastOpenedWorkspace,
  readLastOpenedWorkspace,
  writeLastOpenedWorkspace,
} from "./lastOpenedWorkspace";
import { fitRangeKey, useProjectStore } from "./projectStore";
import { normalizeProject } from "./projectModel";

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
  "reels-edge",
  "reels-bg",
];

describe("project store", () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeCatalog: {
        id: DEFAULT_CATALOG_ID,
        name: DEFAULT_CATALOG_NAME,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        lastOpenedAt: new Date(0).toISOString(),
      },
      isProjectUnsaved: true,
    });
    useProjectStore.getState().loadDemo();
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
      "reelsEdge",
      "reelsBackground",
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
    state.setReelsIncidentEnergy(999);
    state.setEfMinusEvbm(0.7);
    state.updateWindow("browser", { x: 44, y: 55 });
    state.focusWindow("browser");

    const next = useProjectStore.getState().project;
    expect(next.selectedDatasetId).toBe(leips.id);
    expect(next.analysis.bandpassType).toBe(2);
    expect(next.analysis.reelsIncidentEnergy).toBe(999);
    expect(next.analysis.efMinusEvbm).toBe(next.analysis.ups?.efMinusEvbm);
    expect(next.windows.find((window) => window.id === "browser")?.x).toBe(44);
    expect(next.windows.find((window) => window.id === "browser")?.zIndex).toBe(
      Math.max(...next.windows.map((window) => window.zIndex)),
    );
  });

  test("uses a custom LEIPS bandpass energy", () => {
    useProjectStore.getState().setCustomBandpassEnergy(5.12);

    const analysis = useProjectStore.getState().project.analysis;
    expect(analysis.bandpassType).toBe(0);
    expect(analysis.customBandpassEnergy).toBe(5.12);
    expect(analysis.leips?.bandpassEnergy).toBe(5.12);
  });

  test("persists plot viewports in project UI state", () => {
    const viewport = { x: { min: -4, max: 2 }, y: { min: 0, max: 10 } };
    const ipId = useProjectStore.getState().project.analysis.selection.upsIpDatasetIds?.[0];
    expect(ipId).toBeDefined();

    useProjectStore.getState().setBandDiagramViewport(viewport);
    useProjectStore.getState().setUpsVbPlotViewport(viewport);
    useProjectStore.getState().setUpsIpPlotViewport(viewport);
    useProjectStore.getState().setUpsIpPlotViewportForDataset(ipId!, viewport);
    useProjectStore.getState().setUpsBiasPlotViewport("ecutoff", viewport);
    useProjectStore.getState().setLeipsPlotViewport(viewport);
    useProjectStore.getState().setLeipsEvacPlotViewport(viewport);

    expect(useProjectStore.getState().project.ui?.bandDiagramViewport).toEqual(viewport);
    expect(useProjectStore.getState().project.ui?.upsVbPlotViewport).toEqual(viewport);
    expect(useProjectStore.getState().project.ui?.upsIpPlotViewport).toEqual(viewport);
    expect(useProjectStore.getState().project.ui?.upsIpPlotViewportsByDatasetId?.[ipId!]).toEqual(
      viewport,
    );
    expect(useProjectStore.getState().project.ui?.upsBiasPlotViewports?.ecutoff).toEqual(viewport);
    expect(useProjectStore.getState().project.ui?.leipsPlotViewport).toEqual(viewport);
    expect(useProjectStore.getState().project.ui?.leipsEvacPlotViewport).toEqual(viewport);
  });

  test("normalizes legacy UPS bias window size to the wide layout", () => {
    const project = useProjectStore.getState().project;
    const normalized = normalizeProject({
      ...project,
      windows: project.windows.map((window) =>
        window.id === "ups-bias" ? { ...window, width: 560, height: 340 } : window,
      ),
    });

    expect(normalized.windows.find((window) => window.id === "ups-bias")?.width).toBe(1130);
    expect(normalized.windows.find((window) => window.id === "ups-bias")?.y).toBe(366);
  });

  test("normalizes legacy UPS analysis width to the compact right-aligned layout", () => {
    const project = useProjectStore.getState().project;
    const normalized = normalizeProject({
      ...project,
      windows: project.windows.map((window) =>
        window.id === "controls" ? { ...window, x: 1460, width: 420 } : window,
      ),
    });

    expect(normalized.windows.find((window) => window.id === "controls")?.width).toBe(378);
    expect(normalized.windows.find((window) => window.id === "controls")?.x).toBe(1502);
  });

  test("stores per-IP applied voltage and fit ranges", () => {
    const ipId = useProjectStore.getState().project.analysis.selection.upsIpDatasetIds?.[0];
    expect(ipId).toBeDefined();

    useProjectStore.getState().setUpsIpAppliedVoltage(ipId!, -12.5);
    useProjectStore.getState().setUpsIpFitRange(ipId!, "ups-ip-edge", { min: 7, max: 8 });

    const analysis = useProjectStore.getState().project.analysis;
    expect(analysis.upsIpConfigsByDatasetId?.[ipId!]?.appliedVoltage).toBe(-12.5);
    expect(analysis.upsIpFitRangesByDatasetId?.[ipId!]?.cutoffEdge).toEqual({ min: 7, max: 8 });
    expect(
      analysis.ups?.ipResults.find((result) => result.datasetId === ipId)?.appliedVoltage,
    ).toBe(-12.5);
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

  test("resolves Band IP source from average, dataset and 0 V extrapolation", () => {
    const ipResults = useProjectStore.getState().project.analysis.ups?.ipResults ?? [];
    expect(ipResults.length).toBeGreaterThanOrEqual(2);

    useProjectStore.getState().setBandIpSource({ mode: "average" });
    const averageIp = useProjectStore.getState().project.analysis.band?.ip;
    expect(averageIp).toBeGreaterThan(0);

    useProjectStore
      .getState()
      .setBandIpSource({ mode: "dataset", datasetId: ipResults[0]?.datasetId });
    expect(useProjectStore.getState().project.analysis.band?.ip).toBeCloseTo(ipResults[0]?.ip ?? 0);

    useProjectStore.getState().setBandIpSource({ mode: "zero-voltage-extrapolated" });
    expect(useProjectStore.getState().project.analysis.band?.ip).toBeGreaterThan(0);
  });

  test("keeps Band unavailable when 0 V IP extrapolation has fewer than two points", () => {
    const first = useProjectStore.getState().project.analysis.selection.upsIpDatasetIds?.[0];
    expect(first).toBeDefined();

    useProjectStore.getState().assignUpsIpDatasets([first!]);
    useProjectStore.getState().setBandIpSource({ mode: "zero-voltage-extrapolated" });

    expect(useProjectStore.getState().project.analysis.band).toBeUndefined();
    expect(useProjectStore.getState().project.analysis.error).toContain("0 V extrapolated IP");
  });

  test("migrates legacy single UPS IP selection and viewport", () => {
    const project = useProjectStore.getState().project;
    const ipId = project.analysis.selection.upsIpDatasetIds?.[0];
    expect(ipId).toBeDefined();
    useProjectStore.getState().importProject(
      exportProjectJson({
        ...project,
        analysis: {
          ...project.analysis,
          selection: {
            ...project.analysis.selection,
            upsIpDatasetId: ipId,
            upsIpDatasetIds: undefined,
          },
          upsIpFitRangesByDatasetId: undefined,
        },
        ui: {
          ...project.ui,
          upsIpPlotViewport: { x: { min: 1, max: 2 } },
          upsIpPlotViewportsByDatasetId: undefined,
        },
      } as never),
    );

    const imported = useProjectStore.getState().project;
    expect(imported.analysis.selection.upsIpDatasetIds).toEqual([ipId]);
    expect(imported.analysis.upsIpFitRangesByDatasetId?.[ipId!]).toBeDefined();
  });

  test("persists per-plot cursor styles and sample info", () => {
    useProjectStore.getState().setPlotCursorStyle("upsIp", "range");
    useProjectStore.getState().setSampleInfoField("nominalComposition", "Li6PS5Cl");
    useProjectStore.getState().setSampleInfoField("batteryIonSpecies", ["Li+", "Na+"]);
    useProjectStore.getState().setSampleInfoField("sampleName", "sample-a");
    useProjectStore.getState().setSampleInfoField("sampleState", "pellet");

    const project = useProjectStore.getState().project;
    expect(project.ui?.cursorStyles?.upsIp).toBe("range");
    expect(project.ui?.cursorStyles?.leips).toBeUndefined();
    expect(project.ui?.sampleInfo?.nominalComposition).toBe("Li6PS5Cl");

    useProjectStore
      .getState()
      .importProject(exportProjectJson({ ...project, id: "sample-info", name: "Sample Info" }));
    expect(useProjectStore.getState().project.ui?.cursorStyles?.upsIp).toBe("range");
    expect(useProjectStore.getState().project.ui?.sampleInfo?.sampleName).toBe("sample-a");
    expect(useProjectStore.getState().project.ui?.sampleInfo?.sampleState).toBe("pellet");
    expect(useProjectStore.getState().project.ui?.sampleInfo?.nominalComposition).toBe("Li6PS5Cl");
    expect(useProjectStore.getState().project.ui?.sampleInfo?.batteryIonSpecies).toEqual([
      "Li+",
      "Na+",
    ]);
  });

  test("migrates legacy string sample multi-select values", () => {
    const project = {
      ...useProjectStore.getState().project,
      ui: {
        ...useProjectStore.getState().project.ui,
        sampleInfo: { batteryIonSpecies: "Li+" },
      },
    };

    useProjectStore.getState().importProject(exportProjectJson(project as never));

    expect(useProjectStore.getState().project.ui?.sampleInfo?.batteryIonSpecies).toEqual(["Li+"]);
  });

  test("resets individual and all window geometry to defaults", () => {
    const state = useProjectStore.getState();
    state.updateWindow("ups-vb", { x: 999, y: 888, width: 333, height: 222 });

    state.resetWindowPosition("ups-vb");
    expect(
      useProjectStore.getState().project.windows.find((window) => window.id === "ups-vb"),
    ).toMatchObject({
      x: 308,
      y: 26,
      width: 333,
      height: 222,
    });

    state.resetWindowSize("ups-vb");
    expect(
      useProjectStore.getState().project.windows.find((window) => window.id === "ups-vb"),
    ).toMatchObject({
      width: 560,
      height: 330,
    });

    state.updateWindow("ups-ip", { x: 999, y: 888, width: 333, height: 222 });
    state.resetAllWindowPositions();
    state.resetAllWindowSizes();
    expect(
      useProjectStore.getState().project.windows.find((window) => window.id === "ups-ip"),
    ).toMatchObject({
      x: 878,
      y: 26,
      width: 560,
      height: 330,
    });
  });

  test("creates, saves as and loads projects", async () => {
    const state = useProjectStore.getState();
    await state.saveProjectAs("Saved Copy");
    const savedId = useProjectStore.getState().project.id;

    useProjectStore.getState().newProject();
    expect(useProjectStore.getState().project.datasets).toHaveLength(0);
    expect(useProjectStore.getState().project.name).toBe("UPS-LEIPS Project");

    const recent = await useProjectStore.getState().listRecentProjects();
    expect(recent.some((record) => record.id === savedId && record.name === "Saved Copy")).toBe(
      true,
    );

    await useProjectStore.getState().loadSavedProject(savedId);
    expect(useProjectStore.getState().project.name).toBe("Saved Copy");
    expect(useProjectStore.getState().project.datasets).toHaveLength(8);
  });

  test("returns save-as requirement when saving an unsaved new project", async () => {
    useProjectStore.getState().newProject();

    await expect(useProjectStore.getState().saveCurrentProject()).resolves.toBe("needs-name");

    await useProjectStore.getState().saveProjectAs(`Named ${crypto.randomUUID()}`);
    await expect(useProjectStore.getState().saveCurrentProject()).resolves.toBe("saved");
  });

  test("creates and switches catalogs without sharing project lists", async () => {
    const catalogName = `Catalog ${crypto.randomUUID()}`;
    await useProjectStore.getState().createCatalog(catalogName);
    expect(useProjectStore.getState().activeCatalog.name).toBe(catalogName);
    await useProjectStore.getState().saveProjectAs("Catalog Local Project");
    expect(await useProjectStore.getState().listRecentProjects()).toHaveLength(1);

    await useProjectStore.getState().switchCatalog(DEFAULT_CATALOG_ID);
    expect(useProjectStore.getState().activeCatalog.id).toBe(DEFAULT_CATALOG_ID);
    expect(
      (await useProjectStore.getState().listRecentProjects()).some(
        (project) => project.name === "Catalog Local Project",
      ),
    ).toBe(false);
  });

  test("renames and deletes catalogs while keeping a usable active catalog", async () => {
    const firstName = `First ${crypto.randomUUID()}`;
    await useProjectStore.getState().createCatalog(firstName);
    const firstId = useProjectStore.getState().activeCatalog.id;
    await useProjectStore.getState().renameCatalog(firstId, `${firstName} Renamed`);
    expect(useProjectStore.getState().activeCatalog.name).toBe(`${firstName} Renamed`);

    await useProjectStore.getState().createCatalog(`Second ${crypto.randomUUID()}`);
    const secondId = useProjectStore.getState().activeCatalog.id;
    await useProjectStore.getState().deleteCatalog(firstId);
    expect(useProjectStore.getState().activeCatalog.id).toBe(secondId);

    await useProjectStore.getState().deleteCatalog(secondId);
    expect(useProjectStore.getState().activeCatalog.id).not.toBe(secondId);
    expect(useProjectStore.getState().project.name).toBeDefined();
  });

  test("exports and imports the active catalog with project UI state", async () => {
    const catalogName = `Exportable ${crypto.randomUUID()}`;
    await useProjectStore.getState().createCatalog(catalogName);
    useProjectStore.getState().setPlotCursorStyle("upsIp", "range");
    await useProjectStore.getState().saveProjectAs("Stored In Catalog");
    const exported = await useProjectStore
      .getState()
      .exportCatalog(useProjectStore.getState().activeCatalog.id);

    const imported = await useProjectStore.getState().importCatalog(exported);

    expect(imported.id).toBe(useProjectStore.getState().activeCatalog.id);
    expect(imported.name).toBe(`${catalogName} 2`);
    expect(useProjectStore.getState().project.name).toBe("Stored In Catalog");
    expect(useProjectStore.getState().project.ui?.cursorStyles?.upsIp).toBe("range");
  });

  test("restores a last-opened catalog and project reference", async () => {
    const catalogName = `Last Opened ${crypto.randomUUID()}`;
    await useProjectStore.getState().createCatalog(catalogName);
    await useProjectStore.getState().saveProjectAs("Restored Project");
    const ref = {
      catalogId: useProjectStore.getState().activeCatalog.id,
      projectId: useProjectStore.getState().project.id,
    };

    writeLastOpenedWorkspace(ref);
    useProjectStore.setState({
      activeCatalog: {
        id: DEFAULT_CATALOG_ID,
        name: DEFAULT_CATALOG_NAME,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        lastOpenedAt: new Date(0).toISOString(),
      },
      isProjectUnsaved: true,
      project: useProjectStore.getInitialState().project,
    });
    await useProjectStore.getState().restoreLastOpenedWorkspace(readLastOpenedWorkspace()!);

    expect(useProjectStore.getState().activeCatalog.name).toBe(catalogName);
    expect(useProjectStore.getState().project.name).toBe("Restored Project");
    expect(useProjectStore.getState().isProjectUnsaved).toBe(false);
  });

  test("handles empty, invalid and cleared last-opened workspace references", () => {
    clearLastOpenedWorkspace();
    expect(readLastOpenedWorkspace()).toBeUndefined();

    localStorage.setItem(LAST_OPENED_WORKSPACE_KEY, JSON.stringify({ projectId: "missing" }));
    expect(readLastOpenedWorkspace()).toBeUndefined();

    localStorage.setItem(LAST_OPENED_WORKSPACE_KEY, "{");
    expect(readLastOpenedWorkspace()).toBeUndefined();
  });

  test("toggles utility windows", () => {
    useProjectStore.getState().toggleHelpWindow();
    expect(useProjectStore.getState().project.windows.some((window) => window.id === "help")).toBe(
      true,
    );
    useProjectStore.getState().toggleHelpWindow();
    expect(useProjectStore.getState().project.windows.some((window) => window.id === "help")).toBe(
      false,
    );
  });

  test("save as overwrites a saved project with the same name", async () => {
    const name = `Same Name ${crypto.randomUUID()}`;
    await useProjectStore.getState().saveProjectAs(name);
    const firstId = useProjectStore.getState().project.id;
    useProjectStore.getState().newProject();

    await useProjectStore.getState().saveProjectAs(name);

    const recent = await useProjectStore.getState().listRecentProjects();
    expect(useProjectStore.getState().project.id).toBe(firstId);
    expect(recent.filter((record) => record.name === name)).toHaveLength(1);
  });

  test("renames the current project without changing its saved id", async () => {
    const originalName = `Rename Source ${crypto.randomUUID()}`;
    const renamedName = `Rename Target ${crypto.randomUUID()}`;
    await useProjectStore.getState().saveProjectAs(originalName);
    const savedId = useProjectStore.getState().project.id;

    await useProjectStore.getState().renameCurrentProject(renamedName);

    const recent = await useProjectStore.getState().listRecentProjects();
    expect(useProjectStore.getState().project.id).toBe(savedId);
    expect(useProjectStore.getState().project.name).toBe(renamedName);
    expect(recent.some((record) => record.id === savedId && record.name === renamedName)).toBe(
      true,
    );
    expect(recent.some((record) => record.id === savedId && record.name === originalName)).toBe(
      false,
    );
  });

  test("deletes the current saved project and returns to an empty project", async () => {
    await useProjectStore.getState().saveProjectAs("Delete Me");
    const savedId = useProjectStore.getState().project.id;

    await useProjectStore.getState().deleteCurrentProject();

    expect(useProjectStore.getState().project.datasets).toHaveLength(0);
    expect(useProjectStore.getState().project.name).toBe("UPS-LEIPS Project");
    const recent = await useProjectStore.getState().listRecentProjects();
    expect(recent.some((record) => record.id === savedId)).toBe(false);
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

  test("saves the current project through the default database", async () => {
    await useProjectStore.getState().saveCurrentProject();
    expect(useProjectStore.getState().project.id).toBe("default-project");
  });
});
