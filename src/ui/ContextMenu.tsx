import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ContextMenuItem =
  | { type: "item"; label: string; action: () => void | Promise<void> }
  | { type: "submenu"; label: string; items: ContextMenuItem[] }
  | { type: "separator" };

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>();
  return {
    menu,
    closeMenu: () => setMenu(undefined),
    openMenu: (x: number, y: number, items: ContextMenuItem[]) => setMenu({ x, y, items }),
  };
}

export function ContextMenu({
  menu,
  onClose,
}: {
  menu: ContextMenuState | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!menu) {
      return undefined;
    }
    const handleClose = () => onClose();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("pointerdown", handleClose);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handleClose);
      window.removeEventListener("keydown", handleKey);
    };
  }, [menu, onClose]);

  if (!menu) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-[10000] min-w-44 rounded border border-slate-300 bg-white py-1 text-xs text-slate-800 shadow-xl"
      role="menu"
      style={{ left: menu.x, top: menu.y }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <MenuItems items={menu.items} onClose={onClose} />
    </div>,
    document.body,
  );
}

function MenuItems({ items, onClose }: { items: ContextMenuItem[]; onClose: () => void }) {
  return items.map((item, index) => {
    if (item.type === "separator") {
      return <div key={`separator-${index}`} className="my-1 border-t border-slate-200" />;
    }
    if (item.type === "submenu") {
      return (
        <div key={item.label} className="group relative">
          <MenuButton>
            <span>{item.label}</span>
            <span className="text-slate-400">›</span>
          </MenuButton>
          <div className="invisible absolute left-full top-0 min-w-52 rounded border border-slate-300 bg-white py-1 shadow-xl group-hover:visible">
            <MenuItems items={item.items} onClose={onClose} />
          </div>
        </div>
      );
    }
    return (
      <button
        key={item.label}
        className="flex w-full items-center px-3 py-1.5 text-left hover:bg-cyan-50"
        role="menuitem"
        type="button"
        onClick={() => {
          void item.action();
          onClose();
        }}
      >
        {item.label}
      </button>
    );
  });
}

function MenuButton({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left hover:bg-cyan-50">
      {children}
    </div>
  );
}
