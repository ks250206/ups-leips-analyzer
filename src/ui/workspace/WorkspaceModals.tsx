import { useState, type ReactNode } from "react";
import type { CatalogRecord, ProjectRecord } from "../../store/projectTypes";
import { ProjectTable } from "../windows/ProjectListWindow";

export function SaveAsModal({
  defaultName,
  title = "Save as ...",
  actionLabel = "Save",
  helpText = "If a saved project has the same name, it will be overwritten.",
  onCancel,
  onSave,
}: {
  defaultName: string;
  title?: string;
  actionLabel?: string;
  helpText?: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  return (
    <Modal title={title}>
      <label className="block text-xs font-semibold text-slate-600" htmlFor="save-as-name">
        Project name
      </label>
      <input
        id="save-as-name"
        className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <p className="mt-2 text-xs text-slate-500">{helpText}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="rounded bg-slate-950 px-3 py-1 text-xs text-white disabled:bg-slate-400"
          disabled={name.trim().length === 0}
          type="button"
          onClick={() => onSave(name)}
        >
          {actionLabel}
        </button>
      </div>
    </Modal>
  );
}

export function DeleteProjectModal({
  projectName,
  onCancel,
  onDelete,
}: {
  projectName: string;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal title="Delete project">
      <p className="text-sm text-slate-700">
        Delete <span className="font-semibold">{projectName}</span> from saved projects?
      </p>
      <p className="mt-2 text-xs text-slate-500">
        The current workspace will return to an empty project.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="rounded bg-red-700 px-3 py-1 text-xs text-white"
          type="button"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

export function LoadProjectModal({
  projects,
  onCancel,
  onLoad,
}: {
  projects: ProjectRecord[];
  onCancel: () => void;
  onLoad: (id: string) => void;
}) {
  return (
    <Modal title="Load Project" widthClass="w-[620px]" onBackdropClick={onCancel}>
      <div className="h-[360px] overflow-hidden rounded border border-slate-200">
        <ProjectTable projects={projects} onLoad={onLoad} />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function CatalogNameModal({
  defaultName,
  title,
  actionLabel,
  onCancel,
  onSave,
}: {
  defaultName: string;
  title: string;
  actionLabel: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  return (
    <Modal title={title}>
      <label className="block text-xs font-semibold text-slate-600" htmlFor="catalog-name">
        Catalog name
      </label>
      <input
        id="catalog-name"
        className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="rounded bg-slate-950 px-3 py-1 text-xs text-white disabled:bg-slate-400"
          disabled={name.trim().length === 0}
          type="button"
          onClick={() => onSave(name)}
        >
          {actionLabel}
        </button>
      </div>
    </Modal>
  );
}

export function DeleteCatalogModal({
  catalogName,
  onCancel,
  onDelete,
}: {
  catalogName: string;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal title="Delete Catalog">
      <p className="text-sm text-slate-700">
        Delete <span className="font-semibold">{catalogName}</span> and its saved projects?
      </p>
      <p className="mt-2 text-xs text-slate-500">
        This removes only the selected Catalog database. Other Catalogs remain available.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="rounded bg-red-700 px-3 py-1 text-xs text-white"
          type="button"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

export function SwitchCatalogModal({
  activeCatalogId,
  catalogs,
  onCancel,
  onSwitch,
}: {
  activeCatalogId: string;
  catalogs: CatalogRecord[];
  onCancel: () => void;
  onSwitch: (id: string) => void;
}) {
  return (
    <Modal title="Switch Catalog" widthClass="w-[480px]" onBackdropClick={onCancel}>
      <div className="max-h-[320px] overflow-auto rounded border border-slate-200">
        {catalogs.length === 0 ? (
          <div className="p-3 text-sm text-slate-600">No catalogs</div>
        ) : (
          catalogs.map((catalog) => (
            <button
              key={catalog.id}
              className={
                catalog.id === activeCatalogId
                  ? "grid w-full grid-cols-[1fr_auto] gap-3 border-b border-slate-100 bg-cyan-50 px-3 py-2 text-left text-sm"
                  : "grid w-full grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-cyan-50"
              }
              type="button"
              onDoubleClick={() => onSwitch(catalog.id)}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-800">{catalog.name}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  Updated {formatTimestamp(catalog.updatedAt)}
                </span>
              </span>
              <span className="text-[11px] text-slate-500">
                {catalog.id === activeCatalogId ? "Active" : "Double-click"}
              </span>
            </button>
          ))
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          className="rounded border border-slate-300 px-3 py-1 text-xs"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  widthClass = "w-[360px]",
  onBackdropClick,
}: {
  title: string;
  children: ReactNode;
  widthClass?: string;
  onBackdropClick?: () => void;
}) {
  return (
    <div
      data-testid={onBackdropClick ? "modal-backdrop" : undefined}
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/30"
      onPointerDown={onBackdropClick}
    >
      <div
        className={`${widthClass} rounded border border-slate-300 bg-white p-4 shadow-2xl`}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
        {children}
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
