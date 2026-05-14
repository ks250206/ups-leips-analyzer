import { describe, expect, test } from "vite-plus/test";
import { createInitialProject } from "./projectStore";
import {
  deleteProject,
  exportProjectJson,
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
