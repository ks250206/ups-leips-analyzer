import { Activity } from "lucide-react";
import { useRef, useState } from "react";
import type { ProjectRecord, WindowLayout } from "../../store/projectTypes";
import { useProjectStore } from "../../store/projectStore";
import { ContextMenu, type ContextMenuItem, useContextMenu } from "../ContextMenu";

export interface MenuGroup {
  label: string;
  items: ContextMenuItem[];
}

export function TopBar({
  menuGroups,
  onMenuOpen,
}: {
  menuGroups: MenuGroup[];
  onMenuOpen: () => void;
}) {
  const project = useProjectStore((state) => state.project);
  const recalculate = useProjectStore((state) => state.recalculate);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [activeMenu, setActiveMenu] = useState<string>();
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const openGroup = (group: MenuGroup) => {
    const rect = buttonRefs.current.get(group.label)?.getBoundingClientRect();
    setActiveMenu(group.label);
    onMenuOpen();
    openMenu(rect?.left ?? 0, rect?.bottom ?? 0, group.items);
  };
  const closeTopMenu = () => {
    setActiveMenu(undefined);
    closeMenu();
  };

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex h-10 items-center justify-between border-b border-slate-300 bg-slate-950 px-3 text-sm text-slate-100">
      <div className="flex items-center gap-3">
        <Activity size={16} className="text-cyan-300" />
        <h1 className="font-semibold">UPS-LEIPS Analyzer</h1>
        {menuGroups.map((group) => (
          <button
            key={group.label}
            ref={(element) => {
              if (element) {
                buttonRefs.current.set(group.label, element);
              } else {
                buttonRefs.current.delete(group.label);
              }
            }}
            className={
              activeMenu === group.label
                ? "rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100"
                : "rounded px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            }
            type="button"
            onClick={() => openGroup(group)}
            onMouseEnter={() => {
              if (menu) {
                openGroup(group);
              }
            }}
          >
            {group.label}
          </button>
        ))}
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
          {project.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
          type="button"
          onClick={recalculate}
        >
          Recalculate
        </button>
      </div>
      <ContextMenu menu={menu} onClose={closeTopMenu} />
    </header>
  );
}

export function buildMenuGroups(input: {
  project: { name: string };
  windows: WindowLayout[];
  recentProjects: ProjectRecord[];
  actions: {
    deleteProject: () => void;
    exportProject: () => void;
    focusWindow: (id: string) => void;
    importProject: () => void;
    loadProject: () => void;
    loadSavedProject: (id: string) => void;
    newProject: () => void;
    resetAllWindowPositions: () => void;
    resetAllWindowSizes: () => void;
    resetWindowPosition: (id: string) => void;
    resetWindowSize: (id: string) => void;
    resetWorkspaceView: () => void;
    saveAsProject: () => void;
    saveCurrentProject: () => void;
    toggleHelpWindow: () => void;
    toggleProjectsWindow: () => void;
  };
}): MenuGroup[] {
  const windowsItems: ContextMenuItem[] = [
    {
      type: "item",
      label: "Reset all window positions",
      action: input.actions.resetAllWindowPositions,
    },
    { type: "item", label: "Reset all window sizes", action: input.actions.resetAllWindowSizes },
    { type: "separator" },
    ...input.windows.map((window) => ({
      type: "submenu" as const,
      label: window.title,
      items: [
        {
          type: "item" as const,
          label: "Bring to front",
          action: () => input.actions.focusWindow(window.id),
        },
        {
          type: "item" as const,
          label: "Reset position",
          action: () => input.actions.resetWindowPosition(window.id),
        },
        {
          type: "item" as const,
          label: "Reset size",
          action: () => input.actions.resetWindowSize(window.id),
        },
      ],
    })),
  ];
  if (!input.windows.some((window) => window.id === "help")) {
    windowsItems.push({
      type: "item",
      label: "Help",
      action: input.actions.toggleHelpWindow,
    });
  }
  return [
    {
      label: "Project",
      items: [
        { type: "item", label: "New Project", action: input.actions.newProject },
        { type: "item", label: "Save Project", action: input.actions.saveCurrentProject },
        { type: "item", label: "Save as ...", action: input.actions.saveAsProject },
        { type: "item", label: "Load Project", action: input.actions.loadProject },
        { type: "item", label: "Delete project", action: input.actions.deleteProject },
        { type: "separator" },
        { type: "item", label: "Export", action: input.actions.exportProject },
        { type: "item", label: "Import", action: input.actions.importProject },
        { type: "item", label: "Project list", action: input.actions.toggleProjectsWindow },
        { type: "separator" },
        {
          type: "submenu",
          label: "Recent project",
          items:
            input.recentProjects.length > 0
              ? input.recentProjects.map((record) => ({
                  type: "item",
                  label: record.name,
                  action: () => input.actions.loadSavedProject(record.id),
                }))
              : [{ type: "item", label: "No recent projects", disabled: true }],
        },
      ],
    },
    {
      label: "View",
      items: [{ type: "item", label: "Reset view", action: input.actions.resetWorkspaceView }],
    },
    {
      label: "Windows",
      items: windowsItems,
    },
    {
      label: "Help",
      items: [
        { type: "item", label: "About UPS-LEIPS Analyzer", action: input.actions.toggleHelpWindow },
      ],
    },
  ];
}
