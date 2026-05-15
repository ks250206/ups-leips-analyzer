import { ChevronDown, FileUp, MoreHorizontal } from "lucide-react";
import { useRef, useState } from "react";
import type { SpectrumDataset, SpectrumKind } from "../../domain/types";
import { parseMultiPakCsv } from "../../io/multipakCsv";
import { useProjectStore } from "../../store/projectStore";
import { ContextMenu, type ContextMenuItem, useContextMenu } from "../ContextMenu";
import { useToastStore } from "../Toast";

const DATASET_KINDS: SpectrumKind[] = [
  "ups-vb",
  "ups-ip",
  "leet",
  "leet-der",
  "leips",
  "reels",
  "unknown",
];

export function DataBrowser() {
  const project = useProjectStore((state) => state.project);
  const addDatasets = useProjectStore((state) => state.addDatasets);
  const deleteDataset = useProjectStore((state) => state.deleteDataset);
  const selectDataset = useProjectStore((state) => state.selectDataset);
  const setDatasetKind = useProjectStore((state) => state.setDatasetKind);
  const pushToast = useToastStore((state) => state.pushToast);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<SpectrumDataset>();

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

  function datasetMenuItems(dataset: SpectrumDataset): ContextMenuItem[] {
    return [
      {
        type: "submenu",
        label: "Change role",
        items: DATASET_KINDS.map((kind) => ({
          type: "item",
          label: kind === dataset.kind ? `${kind} ✓` : kind,
          action: () => {
            setDatasetKind(dataset.id, kind);
            pushToast(`Changed ${dataset.name} role to ${kind}.`, "success");
          },
        })),
      },
      { type: "separator" },
      {
        type: "item",
        label: "Delete dataset",
        action: () => setDeleteTarget(dataset),
      },
    ];
  }

  function openDatasetMenu(dataset: SpectrumDataset, x: number, y: number) {
    selectDataset(dataset.id);
    openMenu(x, y, datasetMenuItems(dataset));
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
          <DatasetRow
            key={dataset.id}
            assignment={assignmentForDataset(project.analysis.selection, dataset.id)}
            dataset={dataset}
            onMenu={openDatasetMenu}
            onSelect={selectDataset}
          />
        ))}
      </div>
      <div className="border-t border-slate-300 bg-white p-2 text-slate-600">
        {project.datasets.length} datasets
      </div>
      <ContextMenu menu={menu} onClose={closeMenu} />
      {deleteTarget ? (
        <DeleteDatasetModal
          dataset={deleteTarget}
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={() => {
            deleteDataset(deleteTarget.id);
            pushToast(`Deleted ${deleteTarget.name}.`, "success");
            setDeleteTarget(undefined);
          }}
        />
      ) : null}
    </div>
  );
}

function DatasetRow({
  assignment,
  dataset,
  onMenu,
  onSelect,
}: {
  assignment: DatasetAssignment | undefined;
  dataset: SpectrumDataset;
  onMenu: (dataset: SpectrumDataset, x: number, y: number) => void;
  onSelect: (datasetId: string) => void;
}) {
  return (
    <div
      className="flex w-full items-center gap-1 border-b border-slate-200 hover:bg-cyan-50"
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onMenu(dataset, event.clientX, event.clientY);
      }}
    >
      <button
        className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2 py-1.5 text-left"
        type="button"
        onClick={() => onSelect(dataset.id)}
      >
        <span className="min-w-0 truncate">{dataset.name}</span>
        <span
          className={
            assignment
              ? `${assignment.className} rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase`
              : "rounded bg-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-600"
          }
          title={assignment ? `Assigned as ${assignment.label}` : "Not assigned in Analysis"}
        >
          {assignment?.label ?? dataset.kind}
        </span>
      </button>
      <button
        aria-label={`Open ${dataset.name} dataset menu`}
        className="mr-1 rounded p-1 text-slate-500 hover:bg-white hover:text-slate-800"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMenu(dataset, event.clientX, event.clientY);
        }}
      >
        <MoreHorizontal size={13} />
      </button>
    </div>
  );
}

interface DatasetAssignment {
  label: string;
  className: string;
}

function assignmentForDataset(
  selection: {
    upsVbDatasetId?: string;
    upsIpDatasetIds?: string[];
    leetDatasetId?: string;
    leetDerDatasetId?: string;
    leipsDatasetId?: string;
    reelsDatasetId?: string;
  },
  datasetId: string,
): DatasetAssignment | undefined {
  const assignments: Array<[string | undefined, DatasetAssignment]> = [
    [selection.upsVbDatasetId, { label: "UPS-VB", className: "bg-blue-100 text-blue-700" }],
    [selection.leetDatasetId, { label: "LEET", className: "bg-emerald-100 text-emerald-700" }],
    [selection.leetDerDatasetId, { label: "LEET-der", className: "bg-indigo-100 text-indigo-700" }],
    [selection.leipsDatasetId, { label: "LEIPS", className: "bg-red-100 text-red-700" }],
    [selection.reelsDatasetId, { label: "REELS", className: "bg-slate-800 text-white" }],
  ];
  if (selection.upsIpDatasetIds?.includes(datasetId)) {
    return { label: "UPS-IP", className: "bg-rose-100 text-rose-700" };
  }
  return assignments.find(([assignedId]) => assignedId === datasetId)?.[1];
}

function DeleteDatasetModal({
  dataset,
  onCancel,
  onConfirm,
}: {
  dataset: SpectrumDataset;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[11000] grid place-items-center bg-slate-950/20">
      <div
        aria-modal="true"
        className="w-[360px] rounded border border-slate-300 bg-white p-4 text-sm shadow-2xl"
        role="dialog"
      >
        <h2 className="font-semibold text-slate-900">Delete dataset</h2>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          Delete <span className="font-semibold text-slate-800">{dataset.name}</span> from this
          project. The source CSV file is not changed.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            type="button"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
