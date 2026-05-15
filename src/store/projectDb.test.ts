import { describe, expect, test } from "vite-plus/test";
import { createInitialProject } from "./projectStore";
import {
  deleteProject,
  exportProjectGzip,
  exportProjectJson,
  importProjectBytes,
  importProjectJson,
  listProjects,
  loadProject,
  saveProject,
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

  test("rejects invalid project JSON", () => {
    expect(() => importProjectJson("{}")).toThrow("Invalid UPS-LEIPS project JSON.");
  });
});
