import Dexie, { type Table } from "dexie";
import { gzipSync, gunzipSync, strFromU8, strToU8 } from "fflate";
import type { CatalogRecord, ProjectRecord, ProjectSnapshot } from "./projectTypes";

const LEGACY_PROJECT_DB_NAME = "ups-leips-analyzer";
const CATALOG_REGISTRY_DB_NAME = "ups-leips-catalog-registry";
const CATALOG_DB_PREFIX = "ups-leips-catalog";
export const DEFAULT_CATALOG_ID = "default-catalog";
export const DEFAULT_CATALOG_NAME = "Default Catalog";

export class UpsLeipsDatabase extends Dexie {
  projects!: Table<ProjectRecord, string>;

  constructor(name = catalogProjectDbName(DEFAULT_CATALOG_ID)) {
    super(name);
    this.version(1).stores({
      projects: "id, updatedAt, savedAt",
    });
  }
}

export class CatalogRegistryDatabase extends Dexie {
  catalogs!: Table<CatalogRecord, string>;

  constructor(name = CATALOG_REGISTRY_DB_NAME) {
    super(name);
    this.version(1).stores({
      catalogs: "id, updatedAt, lastOpenedAt",
    });
  }
}

interface CatalogArchive {
  format: "ups-leips-catalog";
  version: 1;
  catalog: CatalogRecord;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

const catalogDbCache = new Map<string, UpsLeipsDatabase>();

export const catalogRegistryDb = new CatalogRegistryDatabase();
export const projectDb = getCatalogProjectDb(DEFAULT_CATALOG_ID);

export function catalogProjectDbName(catalogId: string): string {
  return `${CATALOG_DB_PREFIX}-${catalogId}`;
}

export function getCatalogProjectDb(catalogId: string): UpsLeipsDatabase {
  const existing = catalogDbCache.get(catalogId);
  if (existing) {
    return existing;
  }
  const db = new UpsLeipsDatabase(catalogProjectDbName(catalogId));
  catalogDbCache.set(catalogId, db);
  return db;
}

export async function ensureDefaultCatalog(
  registry = catalogRegistryDb,
  defaultDb = getCatalogProjectDb(DEFAULT_CATALOG_ID),
  legacyDb = new UpsLeipsDatabase(LEGACY_PROJECT_DB_NAME),
): Promise<CatalogRecord> {
  const now = new Date().toISOString();
  let catalog = await registry.catalogs.get(DEFAULT_CATALOG_ID);
  if (!catalog) {
    catalog = {
      id: DEFAULT_CATALOG_ID,
      name: DEFAULT_CATALOG_NAME,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };
    await registry.catalogs.put(catalog);
  }
  await migrateLegacyProjectsToDefaultCatalog(defaultDb, legacyDb);
  return catalog;
}

export async function migrateLegacyProjectsToDefaultCatalog(
  defaultDb = getCatalogProjectDb(DEFAULT_CATALOG_ID),
  legacyDb = new UpsLeipsDatabase(LEGACY_PROJECT_DB_NAME),
): Promise<number> {
  const defaultCount = await defaultDb.projects.count();
  if (defaultCount > 0) {
    return 0;
  }
  const legacyProjects = await legacyDb.projects.toArray();
  if (legacyProjects.length > 0) {
    await defaultDb.projects.bulkPut(legacyProjects);
  }
  return legacyProjects.length;
}

export async function listCatalogs(registry = catalogRegistryDb): Promise<CatalogRecord[]> {
  await ensureDefaultCatalog(registry);
  return registry.catalogs.orderBy("updatedAt").reverse().toArray();
}

export async function getCatalog(
  id: string,
  registry = catalogRegistryDb,
): Promise<CatalogRecord | undefined> {
  await ensureDefaultCatalog(registry);
  return registry.catalogs.get(id);
}

export async function createCatalogRecord(
  name: string,
  registry = catalogRegistryDb,
): Promise<CatalogRecord> {
  await ensureDefaultCatalog(registry);
  const now = new Date().toISOString();
  const catalog: CatalogRecord = {
    id: `catalog-${Date.now()}-${crypto.randomUUID()}`,
    name: await uniqueCatalogName(name.trim() || "Untitled Catalog", registry),
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
  await registry.catalogs.put(catalog);
  return catalog;
}

export async function renameCatalogRecord(
  id: string,
  name: string,
  registry = catalogRegistryDb,
): Promise<CatalogRecord | undefined> {
  const catalog = await getCatalog(id, registry);
  if (!catalog) {
    return undefined;
  }
  const now = new Date().toISOString();
  const next = {
    ...catalog,
    name: await uniqueCatalogName(name.trim() || catalog.name, registry, id),
    updatedAt: now,
  };
  await registry.catalogs.put(next);
  return next;
}

export async function touchCatalog(
  id: string,
  registry = catalogRegistryDb,
): Promise<CatalogRecord | undefined> {
  const catalog = await getCatalog(id, registry);
  if (!catalog) {
    return undefined;
  }
  const now = new Date().toISOString();
  const next = { ...catalog, lastOpenedAt: now, updatedAt: now };
  await registry.catalogs.put(next);
  return next;
}

export async function deleteCatalogRecord(
  id: string,
  registry = catalogRegistryDb,
  getDb = getCatalogProjectDb,
): Promise<void> {
  await ensureDefaultCatalog(registry);
  if (id === DEFAULT_CATALOG_ID && (await registry.catalogs.count()) <= 1) {
    return;
  }
  await registry.catalogs.delete(id);
  const db = getDb(id);
  await db.delete();
  catalogDbCache.delete(id);
}

export async function exportCatalogGzip(
  catalogId: string,
  registry = catalogRegistryDb,
  getDb = getCatalogProjectDb,
): Promise<Uint8Array> {
  const catalog = await getCatalog(catalogId, registry);
  if (!catalog) {
    throw new Error("Catalog not found.");
  }
  const db = getDb(catalogId);
  const tables: Record<string, unknown[]> = {};
  for (const table of db.tables) {
    tables[table.name] = await table.toArray();
  }
  const archive: CatalogArchive = {
    format: "ups-leips-catalog",
    version: 1,
    catalog,
    exportedAt: new Date().toISOString(),
    tables,
  };
  return gzipSync(strToU8(JSON.stringify(archive, null, 2)), {
    filename: "catalog.upsleips-catalog.json",
    level: 9,
    mtime: 0,
  });
}

export async function importCatalogGzip(
  bytes: ArrayBuffer | Uint8Array,
  registry = catalogRegistryDb,
  getDb = getCatalogProjectDb,
): Promise<CatalogRecord> {
  await ensureDefaultCatalog(registry);
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const text = isGzip(data) ? strFromU8(gunzipSync(data)) : strFromU8(data);
  const archive = JSON.parse(text) as Partial<CatalogArchive>;
  if (archive.format !== "ups-leips-catalog" || archive.version !== 1 || !archive.catalog) {
    throw new Error("Invalid UPS-LEIPS catalog archive.");
  }
  const now = new Date().toISOString();
  const catalog: CatalogRecord = {
    id: `catalog-${Date.now()}-${crypto.randomUUID()}`,
    name: await uniqueCatalogName(archive.catalog.name || "Imported Catalog", registry),
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
  const db = getDb(catalog.id);
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
      const rows = archive.tables?.[table.name] ?? [];
      if (Array.isArray(rows) && rows.length > 0) {
        await table.bulkPut(rows);
      }
    }
  });
  await registry.catalogs.put(catalog);
  return catalog;
}

async function uniqueCatalogName(
  baseName: string,
  registry: CatalogRegistryDatabase,
  ignoreId?: string,
): Promise<string> {
  const catalogs = await registry.catalogs.toArray();
  const names = new Set(
    catalogs.filter((catalog) => catalog.id !== ignoreId).map((catalog) => catalog.name),
  );
  if (!names.has(baseName)) {
    return baseName;
  }
  let index = 2;
  while (names.has(`${baseName} ${index}`)) {
    index += 1;
  }
  return `${baseName} ${index}`;
}

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

export async function findProjectByName(
  name: string,
  db = projectDb,
): Promise<ProjectRecord | undefined> {
  const projects = await listProjects(db);
  return projects.find((project) => project.name === name);
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
