import { useEffect, useRef, useState } from "react";
import type { PlotViewport } from "./SpectrumPlotModel";

export function useSpectrumPlotViewport({
  onViewportChange,
  viewportRequest,
}: {
  onViewportChange?: (viewport: PlotViewport) => void;
  viewportRequest?: { id: number | string; viewport: PlotViewport };
}) {
  const onViewportChangeRef = useRef(onViewportChange);
  const applyingViewportRequestRef = useRef(false);
  const [viewport, setViewport] = useState<PlotViewport>({});

  const updateViewport = (next: PlotViewport | ((current: PlotViewport) => PlotViewport)) => {
    setViewport((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      if (!isValidPlotViewport(resolved)) {
        return current;
      }
      return plotViewportEquals(current, resolved) ? current : resolved;
    });
  };

  useEffect(() => {
    if (!viewportRequest) {
      return;
    }
    setViewport((current) => {
      if (
        !isValidPlotViewport(viewportRequest.viewport) ||
        plotViewportEquals(current, viewportRequest.viewport)
      ) {
        return current;
      }
      applyingViewportRequestRef.current = true;
      return viewportRequest.viewport;
    });
  }, [viewportRequest?.id, viewportRequest?.viewport]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    if (applyingViewportRequestRef.current) {
      applyingViewportRequestRef.current = false;
      return;
    }
    onViewportChangeRef.current?.(viewport);
  }, [viewport]);

  return { resetViewport: () => updateViewport({}), updateViewport, viewport };
}

function plotViewportEquals(left: PlotViewport, right: PlotViewport): boolean {
  return (
    rangeEquals(left.x, right.x) && rangeEquals(left.y, right.y) && rangeEquals(left.y2, right.y2)
  );
}

function isValidPlotViewport(viewport: PlotViewport): boolean {
  return rangeIsValid(viewport.x) && rangeIsValid(viewport.y) && rangeIsValid(viewport.y2);
}

function rangeIsValid(range: PlotViewport["x"] | undefined): boolean {
  if (!range) {
    return true;
  }
  return (
    Number.isFinite(range.min) &&
    Number.isFinite(range.max) &&
    Math.abs(range.max - range.min) > 1e-12
  );
}

function rangeEquals(
  left: PlotViewport["x"] | undefined,
  right: PlotViewport["x"] | undefined,
): boolean {
  if (!left || !right) {
    return left === right;
  }
  return left.min === right.min && left.max === right.max;
}
