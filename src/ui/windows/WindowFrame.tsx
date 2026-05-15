import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import type { WindowLayout } from "../../store/projectTypes";
import { ContextMenu, type ContextMenuItem, useContextMenu } from "../ContextMenu";

interface WindowFrameProps {
  window: WindowLayout;
  icon: ReactNode;
  children: ReactNode;
  titleBarAccessory?: ReactNode;
  onFocus: () => void;
  onChange: (patch: Partial<WindowLayout>) => void;
  contextMenuItems?: ContextMenuItem[];
  scale?: number;
  isActive?: boolean;
}

export function WindowFrame({
  window,
  icon,
  children,
  titleBarAccessory,
  onFocus,
  onChange,
  contextMenuItems = [],
  scale = 1,
  isActive = false,
}: WindowFrameProps) {
  const { menu, openMenu, closeMenu } = useContextMenu();
  return (
    <>
      <Rnd
        bounds="parent"
        className="workspace-window"
        minWidth={260}
        minHeight={220}
        position={{ x: window.x, y: window.y }}
        size={{ width: window.width, height: window.height }}
        scale={scale}
        cancel=".window-titlebar-control"
        style={{ zIndex: window.zIndex }}
        dragHandleClassName="window-titlebar"
        onDragStart={onFocus}
        onResizeStart={onFocus}
        onDragStop={(_event, data) => onChange({ x: data.x, y: data.y })}
        onResizeStop={(_event, _direction, ref, _delta, position) =>
          onChange({
            width: ref.offsetWidth,
            height: ref.offsetHeight,
            x: position.x,
            y: position.y,
          })
        }
      >
        <section
          className={
            isActive
              ? "flex h-full flex-col overflow-hidden rounded-md border border-slate-700 bg-slate-50 shadow-2xl shadow-slate-700/40 ring-2 ring-slate-500/25"
              : "flex h-full flex-col overflow-hidden rounded-md border border-slate-400 bg-slate-50 shadow-xl shadow-slate-500/20"
          }
          onPointerDownCapture={(event) => {
            if (event.button === 0 || event.button === 2) {
              onFocus();
            }
          }}
          onContextMenu={(event) => {
            if (contextMenuItems.length === 0 || event.defaultPrevented) {
              return;
            }
            event.preventDefault();
            onFocus();
            openMenu(event.clientX, event.clientY, contextMenuItems);
          }}
        >
          <header className="window-titlebar flex h-8 cursor-move items-center justify-between border-b border-slate-300 bg-slate-200 px-2 text-xs font-semibold text-slate-700">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="text-slate-500">{icon}</span>
              <span className="truncate">{window.title}</span>
            </div>
            <div className="window-titlebar-control flex shrink-0 items-center gap-2">
              {titleBarAccessory}
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </section>
      </Rnd>
      <ContextMenu menu={menu} onClose={closeMenu} />
    </>
  );
}
