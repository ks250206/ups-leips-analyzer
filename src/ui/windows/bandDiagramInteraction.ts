import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import type {
  BandDragState,
  BandGeometry,
  BandScaleRange,
  BandViewport,
  IgorBandModel,
} from "./bandDiagramModel";

export function startBandDrag(
  event: ReactPointerEvent<SVGSVGElement>,
  model: IgorBandModel,
  setDrag: (drag: BandDragState | undefined) => void,
  onComplete: (start: { left: number; top: number }, end: { left: number; top: number }) => void,
): void {
  event.preventDefault();
  const svg = event.currentTarget;
  const start = eventPositionInBandPlot(event, model, svg);
  if (!isInsideBandPosition(start, model.geometry)) {
    return;
  }
  setDrag({ start, current: start });
  svg.setPointerCapture?.(event.pointerId);
  const handleMove = (moveEvent: PointerEvent) => {
    setDrag({
      start,
      current: eventPositionInBandPlot(moveEvent, model, svg, false),
    });
  };
  const handleUp = (upEvent: PointerEvent) => {
    const end = eventPositionInBandPlot(upEvent, model, svg, false);
    setDrag(undefined);
    onComplete(start, end);
    svg.releasePointerCapture?.(event.pointerId);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };
  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
}

export function startBandPan(
  event: ReactPointerEvent<SVGSVGElement>,
  model: IgorBandModel,
  viewport: BandViewport,
  updateViewport: (next: BandViewport) => void,
): void {
  event.preventDefault();
  const svg = event.currentTarget;
  const start = eventPositionInBandPlot(event, model, svg);
  if (!isInsideBandPosition(start, model.geometry)) {
    return;
  }
  const startViewport = currentBandViewport(model, viewport);
  svg.setPointerCapture?.(event.pointerId);
  const handleMove = (moveEvent: PointerEvent) => {
    const current = eventPositionInBandPlot(moveEvent, model, svg);
    updateViewport(nextIgorBandViewportAfterPan(startViewport, model, start, current));
  };
  const handleUp = () => {
    svg.releasePointerCapture?.(event.pointerId);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };
  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
}

export function nextIgorBandViewportAfterWheel(
  current: BandViewport,
  model: IgorBandModel,
  event: Pick<
    ReactWheelEvent<SVGSVGElement> | WheelEvent,
    "altKey" | "clientX" | "clientY" | "currentTarget" | "deltaX" | "deltaY" | "shiftKey"
  >,
): BandViewport {
  const x = current.x ?? model.xDomain;
  const y = current.y ?? model.yDomain;
  const y2 = current.y2 ?? model.yRightDomain;
  if (event.altKey) {
    const xDelta =
      event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? (x.max - x.min) * ((event.deltaY || event.deltaX) / model.geometry.plotWidth)
        : 0;
    const yDelta = event.shiftKey
      ? 0
      : (y.max - y.min) * (event.deltaY / model.geometry.plotHeight);
    const y2Delta = event.shiftKey
      ? 0
      : (y2.max - y2.min) * (event.deltaY / model.geometry.plotHeight);
    return {
      x: { min: x.min + xDelta, max: x.max + xDelta },
      y: { min: y.min + yDelta, max: y.max + yDelta },
      y2: { min: y2.min + y2Delta, max: y2.max + y2Delta },
    };
  }
  const position = eventPositionInBandPlot(event, model, event.currentTarget as SVGSVGElement);
  const factor = event.deltaY < 0 || event.deltaX < 0 ? 0.82 : 1.22;
  if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    return {
      ...current,
      x: zoomRangeAt(x, model.xScale.invert(model.geometry.left + position.left), factor),
    };
  }
  return {
    ...current,
    y: zoomRangeAt(y, model.yScale.invert(model.geometry.top + position.top), factor),
    y2: zoomRangeAt(y2, model.yRightScale.invert(model.geometry.top + position.top), factor),
  };
}

export function nextIgorBandViewportAfterDrag(
  current: BandViewport,
  model: IgorBandModel,
  start: { left: number; top: number },
  end: { left: number; top: number },
): BandViewport {
  const mode = inferBandDragMode(Math.abs(end.left - start.left), Math.abs(end.top - start.top));
  if (!mode) {
    return current;
  }
  const next = { ...current };
  if (mode === "x" || mode === "xy") {
    const first = model.xScale.invert(model.geometry.left + start.left);
    const second = model.xScale.invert(model.geometry.left + end.left);
    next.x = normalizeRange(first, second);
  }
  if (mode === "y" || mode === "xy") {
    const first = model.yScale.invert(model.geometry.top + start.top);
    const second = model.yScale.invert(model.geometry.top + end.top);
    const firstRight = model.yRightScale.invert(model.geometry.top + start.top);
    const secondRight = model.yRightScale.invert(model.geometry.top + end.top);
    next.y = normalizeRange(first, second);
    next.y2 = normalizeRange(firstRight, secondRight);
  }
  return next;
}

function nextIgorBandViewportAfterPan(
  current: Required<BandViewport>,
  model: IgorBandModel,
  start: { left: number; top: number },
  end: { left: number; top: number },
): Required<BandViewport> {
  const xDelta =
    model.xScale.invert(model.geometry.left + start.left) -
    model.xScale.invert(model.geometry.left + end.left);
  const yDelta =
    model.yScale.invert(model.geometry.top + start.top) -
    model.yScale.invert(model.geometry.top + end.top);
  const y2Delta =
    model.yRightScale.invert(model.geometry.top + start.top) -
    model.yRightScale.invert(model.geometry.top + end.top);
  return {
    x: { min: current.x.min + xDelta, max: current.x.max + xDelta },
    y: { min: current.y.min + yDelta, max: current.y.max + yDelta },
    y2: { min: current.y2.min + y2Delta, max: current.y2.max + y2Delta },
  };
}

function currentBandViewport(model: IgorBandModel, current: BandViewport): Required<BandViewport> {
  return {
    x: current.x ?? model.xDomain,
    y: current.y ?? model.yDomain,
    y2: current.y2 ?? model.yRightDomain,
  };
}

function eventPositionInBandPlot(
  event: Pick<MouseEvent | PointerEvent | ReactWheelEvent<SVGSVGElement>, "clientX" | "clientY">,
  model: IgorBandModel,
  svg: SVGSVGElement,
  clamp = true,
): { left: number; top: number } {
  const svgLike = svg as SVGSVGElement & { createSVGPoint?: SVGSVGElement["createSVGPoint"] };
  if (typeof svgLike.createSVGPoint !== "function") {
    const rect = svg.getBoundingClientRect();
    const scaleX = 860 / Math.max(rect.width, 1);
    const scaleY = 700 / Math.max(rect.height, 1);
    const position = {
      left: (event.clientX - rect.left) * scaleX - model.geometry.left,
      top: (event.clientY - rect.top) * scaleY - model.geometry.top,
    };
    return clamp ? clampBandPosition(position, model.geometry) : position;
  }
  const point = svgLike.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    return { left: 0, top: 0 };
  }
  const transformed = point.matrixTransform(matrix.inverse());
  const position = {
    left: transformed.x - model.geometry.left,
    top: transformed.y - model.geometry.top,
  };
  return clamp ? clampBandPosition(position, model.geometry) : position;
}

export function clampBandPosition(
  position: { left: number; top: number },
  geometry: Pick<BandGeometry, "plotWidth" | "plotHeight">,
): { left: number; top: number } {
  return {
    left: Math.min(Math.max(position.left, 0), geometry.plotWidth),
    top: Math.min(Math.max(position.top, 0), geometry.plotHeight),
  };
}

function isInsideBandPosition(
  position: { left: number; top: number },
  geometry: Pick<BandGeometry, "plotWidth" | "plotHeight">,
): boolean {
  return (
    position.left >= 0 &&
    position.left <= geometry.plotWidth &&
    position.top >= 0 &&
    position.top <= geometry.plotHeight
  );
}

export function selectionRectForBandDrag(
  start: { left: number; top: number },
  end: { left: number; top: number },
  plotSize: { width: number; height: number },
): { left: number; top: number; width: number; height: number } | undefined {
  const mode = inferBandDragMode(Math.abs(end.left - start.left), Math.abs(end.top - start.top));
  if (!mode) {
    return undefined;
  }
  if (mode === "x") {
    return {
      left: Math.min(start.left, end.left),
      top: 0,
      width: Math.abs(end.left - start.left),
      height: plotSize.height,
    };
  }
  if (mode === "y") {
    return {
      left: 0,
      top: Math.min(start.top, end.top),
      width: plotSize.width,
      height: Math.abs(end.top - start.top),
    };
  }
  return {
    left: Math.min(start.left, end.left),
    top: Math.min(start.top, end.top),
    width: Math.abs(end.left - start.left),
    height: Math.abs(end.top - start.top),
  };
}

function inferBandDragMode(deltaX: number, deltaY: number): "x" | "y" | "xy" | undefined {
  if (deltaX < 8 && deltaY < 8) {
    return undefined;
  }
  if (deltaX > deltaY * 3) {
    return "x";
  }
  if (deltaY > deltaX * 3) {
    return "y";
  }
  return "xy";
}

function zoomRangeAt(range: BandScaleRange, anchor: number, factor: number): BandScaleRange {
  return {
    min: anchor + (range.min - anchor) * factor,
    max: anchor + (range.max - anchor) * factor,
  };
}

function normalizeRange(first: number, second: number): BandScaleRange {
  return { min: Math.min(first, second), max: Math.max(first, second) };
}
