import { Activity } from "lucide-react";
import { useRef, useState } from "react";
import type { ProjectRecord, WindowLayout } from "../../store/projectTypes";
import { useProjectStore } from "../../store/projectStore";
import { ContextMenu, type ContextMenuItem, useContextMenu } from "../ContextMenu";
import { MultiSelectField } from "../FormSelect";
import { localeLabel, USER_LOCALES, type UserLocale } from "../Settings";

export interface MenuGroup {
  label: string;
  items: ContextMenuItem[];
}

export function TopBar({
  menuGroups,
  onMenuOpen,
  zoomScale = 1,
}: {
  menuGroups: MenuGroup[];
  onMenuOpen: () => void;
  zoomScale?: number;
}) {
  const project = useProjectStore((state) => state.project);
  const activeCatalog = useProjectStore((state) => state.activeCatalog);
  const assignUpsIpDatasets = useProjectStore((state) => state.assignUpsIpDatasets);
  const sampleInfo = project.ui?.sampleInfo;
  const upsIpDatasets = project.datasets.filter((dataset) => dataset.kind === "ups-ip");
  const upsIpNames = new Map(upsIpDatasets.map((dataset) => [dataset.id, dataset.name]));
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
      <div className="flex min-w-0 items-center gap-3">
        <Activity size={16} className="text-cyan-300" />
        <h1 className="shrink-0 font-semibold">UPS-LEIPS Analyzer</h1>
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
        <TopBarBadge label="Catalog" value={activeCatalog.name} />
        <TopBarBadge label="Project" value={project.name} />
        {sampleInfo?.sampleName ? (
          <TopBarBadge label="Sample" value={sampleInfo.sampleName} />
        ) : null}
        {sampleInfo?.sampleState ? (
          <TopBarBadge label="State" value={sampleInfo.sampleState} />
        ) : null}
        {sampleInfo?.nominalComposition ? (
          <TopBarBadge label="Composition" value={sampleInfo.nominalComposition} />
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {upsIpDatasets.length > 0 ? (
          <div className="w-[260px] text-xs">
            <MultiSelectField
              ariaLabel="UPS IP datasets"
              options={upsIpDatasets.map((dataset) => dataset.id)}
              values={project.analysis.selection.upsIpDatasetIds ?? []}
              placeholder="UPS IP datasets"
              labelForOption={(id) => upsIpNames.get(id) ?? id}
              summaryLabel={(ids, labelForOption) =>
                ids.length <= 1
                  ? labelForOption(ids[0] ?? "")
                  : `${labelForOption(ids[0] ?? "")} .. + ${ids.length - 1}`
              }
              onChange={assignUpsIpDatasets}
            />
          </div>
        ) : null}
        <span className="rounded border border-cyan-200/60 bg-white/10 px-2 py-1 text-xs font-medium text-white">
          Zoom {Math.round(zoomScale * 100)}%
        </span>
      </div>
      <ContextMenu menu={menu} onClose={closeTopMenu} />
    </header>
  );
}

function TopBarBadge({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="flex max-w-[220px] items-center overflow-hidden rounded border border-cyan-200/70 bg-white/10 text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.10)]"
      title={`${label}: ${value}`}
    >
      <span className="shrink-0 border-r border-cyan-200/50 bg-cyan-300/25 px-1.5 py-0.5 font-semibold text-cyan-50">
        {label}
      </span>
      <span className="truncate bg-slate-900/30 px-2 py-0.5 font-medium text-white">{value}</span>
    </span>
  );
}

export function buildMenuGroups(input: {
  locale: UserLocale;
  project: { name: string };
  windows: WindowLayout[];
  recentProjects: ProjectRecord[];
  actions: {
    createCatalog: () => void;
    deleteProject: () => void;
    deleteCatalog: () => void;
    exportCatalog: () => void;
    exportProject: () => void;
    focusWindow: (id: string) => void;
    importCatalog: () => void;
    importProject: () => void;
    loadProject: () => void;
    loadSavedProject: (id: string) => void;
    newProject: () => void;
    renameCatalog: () => void;
    renameProject: () => void;
    resetAllWindowPositions: () => void;
    resetAllWindowSizes: () => void;
    resetWindowPosition: (id: string) => void;
    resetWindowSize: (id: string) => void;
    resetWorkspaceView: () => void;
    saveAsProject: () => void;
    saveCurrentProject: () => void;
    setLocale: (locale: UserLocale) => void;
    switchCatalog: () => void;
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
      label: "Catalogs",
      items: [
        { type: "item", label: "New Catalog", action: input.actions.createCatalog },
        { type: "item", label: "Switch Catalog", action: input.actions.switchCatalog },
        { type: "item", label: "Rename Catalog", action: input.actions.renameCatalog },
        { type: "separator" },
        { type: "item", label: "Export Catalog", action: input.actions.exportCatalog },
        { type: "item", label: "Import Catalog", action: input.actions.importCatalog },
        { type: "separator" },
        { type: "item", label: "Delete Catalog", action: input.actions.deleteCatalog },
      ],
    },
    {
      label: "Projects",
      items: [
        { type: "item", label: "New Project", action: input.actions.newProject },
        { type: "item", label: "Save Project", action: input.actions.saveCurrentProject },
        { type: "item", label: "Save as ...", action: input.actions.saveAsProject },
        { type: "item", label: "Rename Project", action: input.actions.renameProject },
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
      label: "Setting",
      items: [
        {
          type: "submenu",
          label: "Language",
          items: USER_LOCALES.map((locale) => ({
            type: "item",
            label: `${locale === input.locale ? "✓ " : ""}${localeLabel(locale)}`,
            action: () => input.actions.setLocale(locale),
          })),
        },
      ],
    },
    {
      label: "Help",
      items: [
        { type: "item", label: "About UPS-LEIPS Analyzer", action: input.actions.toggleHelpWindow },
      ],
    },
  ];
}
