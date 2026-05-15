import { Download, FileUp, RefreshCcw, Upload } from "lucide-react";
import { useState } from "react";
import { parseMultiPakCsv } from "../../io/multipakCsv";
import { exportProjectGzip, exportProjectJson, importProjectBytes } from "../../store/projectDb";
import { useProjectStore } from "../../store/projectStore";

export function DataBrowser() {
  const project = useProjectStore((state) => state.project);
  const loadDemo = useProjectStore((state) => state.loadDemo);
  const addDatasets = useProjectStore((state) => state.addDatasets);
  const selectDataset = useProjectStore((state) => state.selectDataset);
  const importProject = useProjectStore((state) => state.importProject);
  const [error, setError] = useState<string>();

  async function handleFiles(fileList: FileList | null) {
    const files = [...(fileList ?? [])];
    if (files.length === 0) {
      return;
    }
    setError(undefined);
    try {
      const parsed = await Promise.all(
        files.map(async (file) => parseMultiPakCsv(await file.text(), { sourceName: file.name })),
      );
      addDatasets(parsed.flat());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function handleProjectFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }
    setError(undefined);
    try {
      importProject(exportProjectJson(importProjectBytes(await file.arrayBuffer())));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  function exportProject() {
    const compressed = exportProjectGzip(project);
    const blob = new Blob([compressed.slice().buffer as ArrayBuffer], { type: "application/gzip" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.upsleips.gz`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col bg-slate-100 text-xs">
      <div className="grid grid-cols-2 gap-2 border-b border-slate-300 p-2">
        <input
          id="dataset-csv-input"
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={(event) => {
            void handleFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <label
          className="flex cursor-pointer items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-cyan-50"
          htmlFor="dataset-csv-input"
        >
          <FileUp size={14} />
          CSV
        </label>
        <button
          className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-cyan-50"
          type="button"
          onClick={loadDemo}
        >
          <RefreshCcw size={14} />
          Demo
        </button>
        <button
          className="flex items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-cyan-50"
          type="button"
          onClick={exportProject}
        >
          <Download size={14} />
          GZIP
        </button>
        <input
          id="project-json-input"
          className="sr-only"
          type="file"
          accept=".upsleips,.gz,.json,application/json,application/gzip"
          onChange={(event) => {
            void handleProjectFile(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <label
          className="flex cursor-pointer items-center justify-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-cyan-50"
          htmlFor="project-json-input"
        >
          <Upload size={14} />
          Import
        </label>
      </div>
      {error ? (
        <div className="border-b border-red-200 bg-red-50 p-2 text-red-700">{error}</div>
      ) : null}
      <div className="border-b border-slate-300 bg-slate-50 px-2 py-1 font-semibold text-slate-600">
        root
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {project.datasets.map((dataset) => (
          <button
            key={dataset.id}
            className="flex w-full items-center justify-between gap-2 border-b border-slate-200 px-2 py-1.5 text-left hover:bg-cyan-50"
            type="button"
            onClick={() => selectDataset(dataset.id)}
          >
            <span className="min-w-0 truncate">{dataset.name}</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-600">
              {dataset.kind}
            </span>
          </button>
        ))}
      </div>
      <div className="border-t border-slate-300 bg-white p-2 text-slate-600">
        {project.datasets.length} datasets
      </div>
    </div>
  );
}
