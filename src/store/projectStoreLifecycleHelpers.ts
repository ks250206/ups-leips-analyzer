import {
  DEFAULT_CATALOG_ID,
  DEFAULT_CATALOG_NAME,
  ensureDefaultCatalog,
  getCatalog,
  getCatalogProjectDb,
  listProjects,
} from "./projectDb";
import type { CatalogRecord, ProjectSnapshot } from "./projectTypes";

export const DEFAULT_CATALOG: CatalogRecord = {
  id: DEFAULT_CATALOG_ID,
  name: DEFAULT_CATALOG_NAME,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  lastOpenedAt: new Date(0).toISOString(),
};

export async function activeProjectDb(catalogId: string) {
  await ensureDefaultCatalog();
  const catalog = await getCatalog(catalogId);
  return getCatalogProjectDb(catalog?.id ?? DEFAULT_CATALOG_ID);
}

export async function latestProjectForCatalog(
  catalogId: string,
): Promise<ProjectSnapshot | undefined> {
  const db = await activeProjectDb(catalogId);
  const projects = await listProjects(db);
  if (projects.length === 0) {
    return undefined;
  }
  const { savedAt: _savedAt, ...project } = projects[0]!;
  return project;
}
