import { useRef, useState, type PointerEvent, type WheelEvent } from "react";

export interface WorkspaceViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface WorkspaceViewportSize {
  width: number;
  height: number;
}

export interface WorkspaceViewportWindow {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function viewportCenteredOnWindow(
  current: WorkspaceViewportState,
  window: WorkspaceViewportWindow,
  visibleArea: WorkspaceViewportSize,
): WorkspaceViewportState {
  return {
    ...current,
    x: visibleArea.width / 2 - (window.x + window.width / 2) * current.scale,
    y: visibleArea.height / 2 - (window.y + window.height / 2) * current.scale,
  };
}

export function useWorkspaceViewport() {
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const panStart = useRef<{ x: number; y: number; originX: number; originY: number } | undefined>(
    undefined,
  );
  const resetWorkspaceView = () => setViewport({ x: 0, y: 0, scale: 1 });
  const goToWindow = (window: WorkspaceViewportWindow, visibleArea: WorkspaceViewportSize) =>
    setViewport((current) => viewportCenteredOnWindow(current, window, visibleArea));
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-plot-host='true']") && !event.metaKey && !event.ctrlKey) {
      return;
    }
    if (!event.metaKey && !event.ctrlKey && target.closest(".workspace-window")) {
      return;
    }
    event.preventDefault();
    if (event.metaKey || event.ctrlKey) {
      const nextScale = Math.min(2, Math.max(0.45, viewport.scale - event.deltaY * 0.001));
      const scale = Number(nextScale.toFixed(2));
      const worldX = (event.clientX - viewport.x) / viewport.scale;
      const worldY = (event.clientY - viewport.y) / viewport.scale;
      setViewport({
        x: event.clientX - worldX * scale,
        y: event.clientY - worldY * scale,
        scale,
      });
      return;
    }
    const horizontalDelta = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
    setViewport({
      ...viewport,
      x: viewport.x - horizontalDelta,
      y: viewport.y - (event.shiftKey ? 0 : event.deltaY),
    });
  };
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isBackground =
      target.dataset.workspaceSurface === "true" || target.dataset.workspacePlane === "true";
    if (event.button !== 0 || !isBackground) {
      return;
    }
    panStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = panStart.current;
    if (!drag) {
      return;
    }
    setViewport({
      ...viewport,
      x: drag.originX + event.clientX - drag.x,
      y: drag.originY + event.clientY - drag.y,
    });
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    panStart.current = undefined;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    goToWindow,
    resetWorkspaceView,
    viewport,
  };
}
