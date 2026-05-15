import Dexie, { type Table } from "dexie";
import { gzipSync, gunzipSync, strFromU8, strToU8 } from "fflate";
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

export function exportProjectGzip(snapshot: ProjectSnapshot): Uint8Array {
  return gzipSync(strToU8(exportProjectJson(snapshot)), {
    filename: "project.upsleips.json",
    level: 9,
    mtime: 0,
  });
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

export function importProjectBytes(bytes: ArrayBuffer | Uint8Array): ProjectSnapshot {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const text = isGzip(data) ? strFromU8(gunzipSync(data)) : strFromU8(data);
  return importProjectJson(text);
}

function isGzip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}
