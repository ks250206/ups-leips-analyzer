import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import type { ProjectRecord } from "../../store/projectTypes";

export function ProjectListWindow() {
  const listRecentProjects = useProjectStore((state) => state.listRecentProjects);
  const loadSavedProject = useProjectStore((state) => state.loadSavedProject);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);

  useEffect(() => {
    void listRecentProjects().then(setProjects);
  }, [listRecentProjects]);

  return (
    <div className="h-full bg-white text-xs">
      <ProjectTable projects={projects} onLoad={(id) => void loadSavedProject(id)} />
    </div>
  );
}

export function ProjectTable({
  projects,
  onLoad,
}: {
  projects: ProjectRecord[];
  onLoad: (id: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useMemo<ColumnDef<ProjectRecord>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Project name",
        cell: (info) => info.getValue<string>(),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: (info) => formatTimestamp(info.getValue<string>()),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: (info) => formatTimestamp(info.getValue<string>()),
      },
    ],
    [],
  );
  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
    overscan: 8,
    useFlushSync: false,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-600">
        {table.getHeaderGroups()[0]?.headers.map((header) => (
          <div key={header.id} className="truncate border-r border-slate-200 px-2 py-1">
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
      </div>
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="p-3 text-sm text-slate-600">No saved projects</div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const project = row.original;
              return (
                <button
                  key={row.id}
                  className="grid w-full grid-cols-[1.4fr_1fr_1fr] border-b border-slate-100 text-left hover:bg-cyan-50"
                  style={{
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  type="button"
                  onDoubleClick={() => onLoad(project.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <span key={cell.id} className="truncate border-r border-slate-100 px-2 py-1.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}
