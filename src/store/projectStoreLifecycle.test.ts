import { beforeEach, describe, expect, test } from "vite-plus/test";
import { DEFAULT_CATALOG_ID, DEFAULT_CATALOG_NAME } from "./projectDb";
import {
  LAST_OPENED_WORKSPACE_KEY,
  clearLastOpenedWorkspace,
  readLastOpenedWorkspace,
  writeLastOpenedWorkspace,
} from "./lastOpenedWorkspace";
import { useProjectStore } from "./projectStore";
import { resetProjectStoreWithDemo } from "./projectStoreTestUtils";

describe("project store lifecycle and catalogs", () => {
  beforeEach(() => {
    resetProjectStoreWithDemo();
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

  test("saves the current project through the default database", async () => {
    await useProjectStore.getState().saveCurrentProject();
    expect(useProjectStore.getState().project.id).toBe("default-project");
  });
});
