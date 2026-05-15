import { useState, type ReactNode } from "react";
import type { ProjectRecord } from "../../store/projectTypes";
import { ProjectTable } from "../windows/ProjectListWindow";

export function SaveAsModal({
  defaultName,
  onCancel,
  onSave,
}: {
  defaultName: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  return (
    <Modal title="Save as ...">
      <label className="block text-xs font-semibold text-slate-600" htmlFor="save-as-name">
        Project name
      </label>
      <input
        id="save-as-name"
        className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <p className="mt-2 text-xs text-slate-500">
        If a saved project has the same name, it will be overwritten.
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
          className="rounded bg-slate-950 px-3 py-1 text-xs text-white disabled:bg-slate-400"
          disabled={name.trim().length === 0}
          type="button"
          onClick={() => onSave(name)}
        >
          Save
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
    <Modal title="Load Project" widthClass="w-[620px]">
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

function Modal({
  title,
  children,
  widthClass = "w-[360px]",
}: {
  title: string;
  children: ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/30">
      <div className={`${widthClass} rounded border border-slate-300 bg-white p-4 shadow-2xl`}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}
