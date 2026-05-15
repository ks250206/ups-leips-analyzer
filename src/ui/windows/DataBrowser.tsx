import { ChevronDown, FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { parseMultiPakCsv } from "../../io/multipakCsv";
import { useProjectStore } from "../../store/projectStore";
import { useToastStore } from "../Toast";

export function DataBrowser() {
  const project = useProjectStore((state) => state.project);
  const addDatasets = useProjectStore((state) => state.addDatasets);
  const selectDataset = useProjectStore((state) => state.selectDataset);
  const pushToast = useToastStore((state) => state.pushToast);
  const csvInputRef = useRef<HTMLInputElement>(null);
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
      const datasets = parsed.flat();
      addDatasets(datasets);
      pushToast(`Loaded ${datasets.length} dataset${datasets.length === 1 ? "" : "s"}.`, "success");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setError(message);
      pushToast(`CSV load failed: ${message}`, "error");
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-100 text-xs">
      <div className="border-b border-slate-300 p-2">
        <div
          role="button"
          tabIndex={0}
          className="relative flex cursor-pointer items-center justify-between gap-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-left hover:bg-cyan-50"
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleFiles(event.dataTransfer.files);
          }}
          onClick={() => csvInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              csvInputRef.current?.click();
            }
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <input
            ref={csvInputRef}
            aria-label="Load CSV files"
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
            type="file"
            accept=".csv,text/csv"
            multiple
            onChange={(event) => {
              void handleFiles(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleFiles(event.dataTransfer.files);
            }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          />
          <span className="flex items-center gap-1.5">
            <FileUp size={14} />
            Load CSVs
          </span>
          <ChevronDown size={14} className="text-slate-500" />
        </div>
        <div className="mt-1 text-[10px] text-slate-500">
          Dropdown file field for MultiPak CSVs.
        </div>
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
