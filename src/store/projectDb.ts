import Dexie, { type Table } from "dexie";
import type { ProjectRecord, ProjectSnapshot } from "./projectTypes";

const DB_NAME = "ups-leips-analyzer";

export class UpsLeipsDatabase extends Dexie {
  projects!: Table<ProjectRecord, string>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      projects: "id, updatedAt, savedAt",
    });
  }
}

export const projectDb = new UpsLeipsDatabase();

export async function saveProject(snapshot: ProjectSnapshot, db = projectDb): Promise<void> {
  await db.projects.put({ ...snapshot, savedAt: new Date().toISOString() });
}

export async function loadProject(
  id: string,
  db = projectDb,
): Promise<ProjectSnapshot | undefined> {
  const record = await db.projects.get(id);
  if (!record) {
    return undefined;
  }
  const { savedAt: _savedAt, ...snapshot } = record;
  return snapshot;
}

export async function listProjects(db = projectDb): Promise<ProjectRecord[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function deleteProject(id: string, db = projectDb): Promise<void> {
  await db.projects.delete(id);
}

export function exportProjectJson(snapshot: ProjectSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function importProjectJson(text: string): ProjectSnapshot {
  const parsed = JSON.parse(text) as Partial<ProjectSnapshot>;
  if (
    !parsed.id ||
    !parsed.name ||
    !Array.isArray(parsed.datasets) ||
    !parsed.analysis ||
    !Array.isArray(parsed.windows)
  ) {
    throw new Error("Invalid UPS-LEIPS project JSON.");
  }
  return parsed as ProjectSnapshot;
}
