import { describe, expect, test } from "vite-plus/test";
import { createInitialProject } from "./projectStore";
import {
  CatalogRegistryDatabase,
  createCatalogRecord,
  deleteCatalogRecord,
  deleteProject,
  ensureDefaultCatalog,
  exportCatalogGzip,
  exportProjectGzip,
  exportProjectJson,
  importCatalogGzip,
  importProjectBytes,
  importProjectJson,
  listProjects,
  renameCatalogRecord,
  loadProject,
  migrateLegacyProjectsToDefaultCatalog,
  saveProject,
  touchCatalog,
  UpsLeipsDatabase,
} from "./projectDb";

describe("project persistence", () => {
  test("roundtrips project JSON", () => {
    const project = createInitialProject();
    const imported = importProjectJson(exportProjectJson(project));
    expect(imported.id).toBe(project.id);
    expect(imported.datasets.length).toBe(project.datasets.length);
  });

  test("roundtrips gzip-compressed project export", () => {
    const project = createInitialProject();
    const compressed = exportProjectGzip(project);
    expect(compressed[0]).toBe(0x1f);
    expect(compressed[1]).toBe(0x8b);

    const imported = importProjectBytes(compressed);
    expect(imported.id).toBe(project.id);
    expect(imported.name).toBe(project.name);
  });

  test("keeps raw JSON import compatibility for binary project import", () => {
    const project = createInitialProject();
    const imported = importProjectBytes(new TextEncoder().encode(exportProjectJson(project)));
    expect(imported.id).toBe(project.id);
  });

  test("saves and loads via Dexie", async () => {
    const db = new UpsLeipsDatabase(`ups-leips-test-${crypto.randomUUID()}`);
    const project = createInitialProject();
    await saveProject(project, db);
    const loaded = await loadProject(project.id, db);
    expect(loaded?.name).toBe(project.name);
    expect(await listProjects(db)).toHaveLength(1);
    await deleteProject(project.id, db);
    expect(await loadProject(project.id, db)).toBeUndefined();
    await db.delete();
  });

  test("migrates legacy projects into the default catalog project database", async () => {
    const legacyDb = new UpsLeipsDatabase(`legacy-${crypto.randomUUID()}`);
    const defaultDb = new UpsLeipsDatabase(`default-${crypto.randomUUID()}`);
    const project = createInitialProject();
    await saveProject({ ...project, id: "legacy-project", name: "Legacy Project" }, legacyDb);

    const migrated = await migrateLegacyProjectsToDefaultCatalog(defaultDb, legacyDb);

    expect(migrated).toBe(1);
    expect((await loadProject("legacy-project", defaultDb))?.name).toBe("Legacy Project");
    await legacyDb.delete();
    await defaultDb.delete();
  });

  test("exports and imports a catalog archive as a new catalog", async () => {
    const runId = crypto.randomUUID();
    const registry = new CatalogRegistryDatabase(`registry-${runId}`);
    const dbs = new Map<string, UpsLeipsDatabase>();
    const getDb = (id: string) => {
      const existing = dbs.get(id);
      if (existing) {
        return existing;
      }
      const db = new UpsLeipsDatabase(`catalog-${runId}-${id}`);
      dbs.set(id, db);
      return db;
    };
    await ensureDefaultCatalog(
      registry,
      getDb("default-catalog"),
      new UpsLeipsDatabase(`legacy-${runId}`),
    );
    const catalog = await createCatalogRecord("Run", registry);
    await saveProject(
      { ...createInitialProject(), id: "project-a", name: "Project A" },
      getDb(catalog.id),
    );

    const exported = await exportCatalogGzip(catalog.id, registry, getDb);
    const imported = await importCatalogGzip(exported, registry, getDb);

    expect(imported.id).not.toBe(catalog.id);
    expect(imported.name).toBe("Run 2");
    expect((await loadProject("project-a", getDb(imported.id)))?.name).toBe("Project A");
    await Promise.all([...dbs.values()].map((db) => db.delete()));
    await registry.delete();
  });

  test("handles catalog edge cases and invalid archives", async () => {
    const runId = crypto.randomUUID();
    const registry = new CatalogRegistryDatabase(`registry-edge-${runId}`);
    const defaultDb = new UpsLeipsDatabase(`default-edge-${runId}`);
    const legacyDb = new UpsLeipsDatabase(`legacy-edge-${runId}`);

    const defaultCatalog = await ensureDefaultCatalog(registry, defaultDb, legacyDb);
    expect(defaultCatalog.name).toBe("Default Catalog");
    expect(await migrateLegacyProjectsToDefaultCatalog(defaultDb, legacyDb)).toBe(0);
    await saveProject({ ...createInitialProject(), id: "existing" }, defaultDb);
    expect(await migrateLegacyProjectsToDefaultCatalog(defaultDb, legacyDb)).toBe(0);

    const untitled = await createCatalogRecord("", registry);
    expect(untitled.name).toBe("Untitled Catalog");
    expect(await renameCatalogRecord("missing", "Name", registry)).toBeUndefined();
    expect(await touchCatalog("missing", registry)).toBeUndefined();
    await deleteCatalogRecord("missing", registry, () => new UpsLeipsDatabase(`missing-${runId}`));
    await expect(exportCatalogGzip("missing", registry)).rejects.toThrow("Catalog not found.");
    await expect(importCatalogGzip(new TextEncoder().encode("{}"), registry)).rejects.toThrow(
      "Invalid UPS-LEIPS catalog archive.",
    );

    await defaultDb.delete();
    await legacyDb.delete();
    await registry.delete();
  });

  test("clears projects when deleting the only default catalog", async () => {
    const runId = crypto.randomUUID();
    const registry = new CatalogRegistryDatabase(`registry-clear-${runId}`);
    const defaultDb = new UpsLeipsDatabase(`default-clear-${runId}`);
    const legacyDb = new UpsLeipsDatabase(`legacy-clear-${runId}`);
    const getDb = (id: string) => {
      expect(id).toBe("default-catalog");
      return defaultDb;
    };

    await ensureDefaultCatalog(registry, defaultDb, legacyDb);
    await saveProject({ ...createInitialProject(), id: "kept-before-delete" }, defaultDb);

    await deleteCatalogRecord("default-catalog", registry, getDb);

    expect(await registry.catalogs.count()).toBe(1);
    expect(await listProjects(defaultDb)).toHaveLength(0);
    await defaultDb.delete();
    await legacyDb.delete();
    await registry.delete();
  });

  test("rejects invalid project JSON", () => {
    expect(() => importProjectJson("{}")).toThrow("Invalid UPS-LEIPS project JSON.");
  });
});
