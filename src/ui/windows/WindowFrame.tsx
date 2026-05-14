import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import type { WindowLayout } from "../../store/projectTypes";

interface WindowFrameProps {
  window: WindowLayout;
  icon: ReactNode;
  children: ReactNode;
  onFocus: () => void;
  onChange: (patch: Partial<WindowLayout>) => void;
}

export function WindowFrame({ window, icon, children, onFocus, onChange }: WindowFrameProps) {
  return (
    <Rnd
      bounds="parent"
      minWidth={260}
      minHeight={220}
      position={{ x: window.x, y: window.y }}
      size={{ width: window.width, height: window.height }}
      style={{ zIndex: window.zIndex }}
      dragHandleClassName="window-titlebar"
      onMouseDown={onFocus}
      onDragStop={(_event, data) => onChange({ x: data.x, y: data.y })}
      onResizeStop={(_event, _direction, ref, _delta, position) =>
        onChange({ width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y })
      }
    >
      <section className="flex h-full flex-col overflow-hidden rounded-md border border-slate-400 bg-slate-50 shadow-xl">
        <header className="window-titlebar flex h-8 cursor-move items-center justify-between border-b border-slate-300 bg-slate-200 px-2 text-xs font-semibold text-slate-700">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-slate-500">{icon}</span>
            <span className="truncate">{window.title}</span>
          </div>
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </section>
    </Rnd>
  );
}
