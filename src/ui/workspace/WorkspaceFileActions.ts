import { exportProjectGzip, exportProjectJson, importProjectBytes } from "../../store/projectDb";
import type { CatalogRecord, ProjectSnapshot } from "../../store/projectTypes";

export function createWorkspaceFileActions({
  activeCatalog,
  exportCatalogBytes,
  importCatalogBytes,
  importProject,
  project,
  pushToast,
  refreshCatalogs,
  refreshRecentProjects,
}: {
  activeCatalog: CatalogRecord;
  exportCatalogBytes: (id: string) => Promise<Uint8Array>;
  importCatalogBytes: (bytes: ArrayBuffer | Uint8Array) => Promise<CatalogRecord>;
  importProject: (json: string) => void;
  project: ProjectSnapshot;
  pushToast: (message: string, kind: "success" | "error") => void;
  refreshCatalogs: () => void;
  refreshRecentProjects: () => void;
}) {
  return {
    exportActiveCatalog: () => {
      void exportCatalogBytes(activeCatalog.id)
        .then((compressed) => {
          downloadGzip(compressed, `${slug(activeCatalog.name)}.upsleips-catalog.json.gz`);
          pushToast("Catalog exported.", "success");
        })
        .catch((caught: unknown) => {
          pushToast(errorMessage("Catalog export failed", caught), "error");
        });
    },
    exportProject: () => {
      try {
        downloadGzip(exportProjectGzip(project), `${slug(project.name)}.upsleips.json.gz`);
        pushToast("Project exported.", "success");
      } catch (caught) {
        pushToast(errorMessage("Project export failed", caught), "error");
      }
    },
    importCatalogFile: async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) {
        return;
      }
      try {
        const catalog = await importCatalogBytes(await file.arrayBuffer());
        refreshCatalogs();
        refreshRecentProjects();
        pushToast(`Catalog imported: ${catalog.name}.`, "success");
      } catch (caught) {
        pushToast(errorMessage("Catalog import failed", caught), "error");
      }
    },
    importProjectFile: async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) {
        return;
      }
      try {
        importProject(exportProjectJson(importProjectBytes(await file.arrayBuffer())));
        pushToast(`Project imported from ${file.name}.`, "success");
      } catch (caught) {
        pushToast(errorMessage("Project import failed", caught), "error");
      }
    },
  };
}

function downloadGzip(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/gzip" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slug(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

function errorMessage(prefix: string, caught: unknown): string {
  return `${prefix}: ${caught instanceof Error ? caught.message : String(caught)}`;
}
