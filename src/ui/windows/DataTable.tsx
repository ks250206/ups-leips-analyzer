import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import type { Point } from "../../domain/types";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";

export function DataTable() {
  const project = useProjectStore((state) => state.project);
  const selected =
    project.datasets.find((dataset) => dataset.id === project.selectedDatasetId) ??
    project.datasets[0];
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useMemo<ColumnDef<Point>[]>(
    () => [
      { header: "index", cell: (info) => info.row.index + 1 },
      {
        accessorKey: "x",
        header: selected?.xLabel ?? "x",
        cell: (info) => formatNumber(info.getValue<number>(), 5),
      },
      {
        accessorKey: "y",
        header: selected?.yLabel ?? "y",
        cell: (info) => formatNumber(info.getValue<number>(), 5),
      },
    ],
    [selected?.xLabel, selected?.yLabel],
  );
  const data = selected?.points ?? [];
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 8,
    useFlushSync: false,
  });

  if (!selected) {
    return <div className="p-3 text-sm text-slate-600">No dataset</div>;
  }

  return (
    <div className="flex h-full flex-col bg-white text-xs">
      <div className="border-b border-slate-300 px-2 py-1 font-semibold text-slate-700">
        {selected.name}
      </div>
      <div className="grid grid-cols-[64px_1fr_1fr] border-b border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-600">
        {table.getHeaderGroups()[0]?.headers.map((header) => (
          <div key={header.id} className="truncate border-r border-slate-200 px-2 py-1">
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
      </div>
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="grid grid-cols-[64px_1fr_1fr] border-b border-slate-100"
                style={{
                  position: "absolute",
                  top: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  width: "100%",
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="truncate border-r border-slate-100 px-2 py-1 font-mono text-[11px]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
