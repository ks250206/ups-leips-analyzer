import { scaleLinear, type ScaleLinear } from "d3-scale";
import { line } from "d3-shape";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { BandDiagramResult, Point } from "../../domain/types";
import { useProjectStore } from "../../store/projectStore";
import { ContextMenu, useContextMenu } from "../ContextMenu";
import { formatNumber } from "../format";

export function BandDiagramWindow() {
  const band = useProjectStore((state) => state.project.analysis.band);
  const [upsScale, setUpsScale] = useState(1);
  const [upsOffset, setUpsOffset] = useState(0);
  const [leipsScale, setLeipsScale] = useState(1);
  const [leipsOffset, setLeipsOffset] = useState(0);
  const [indicatorFontSize, setIndicatorFontSize] = useState(34);
  const [indicatorArrowScale, setIndicatorArrowScale] = useState(1);
  const bandXDomain = useMemo(() => {
    const points = band ? [...band.upsPoints, ...band.leipsPoints] : [];
    if (points.length === 0) {
      return { min: -10, max: 6 };
    }
    return {
      min: Math.min(...points.map((point) => point.x)),
      max: Math.max(...points.map((point) => point.x)),
    };
  }, [band]);
  const [xMin, setXMin] = useState(bandXDomain.min);
  const [xMax, setXMax] = useState(bandXDomain.max);
  const [viewport, setViewport] = useState<BandViewport>({});

  useEffect(() => {
    setXMin(bandXDomain.min);
    setXMax(bandXDomain.max);
    setViewport({});
  }, [bandXDomain.min, bandXDomain.max]);
  const handleViewportChange = (next: BandViewport) => {
    setViewport(next);
    if (next.x) {
      setXMin(Number(next.x.min.toFixed(3)));
      setXMax(Number(next.x.max.toFixed(3)));
    } else if (!next.y && !next.y2) {
      setXMin(bandXDomain.min);
      setXMax(bandXDomain.max);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white select-none">
      <div className="min-h-0 flex-1">
        <IgorBandDiagramPlot
          band={band}
          xDomain={{ min: Math.min(xMin, xMax), max: Math.max(xMin, xMax) }}
          upsScale={upsScale}
          upsOffset={upsOffset}
          leipsScale={leipsScale}
          leipsOffset={leipsOffset}
          indicatorFontSize={indicatorFontSize}
          indicatorArrowScale={indicatorArrowScale}
          viewport={viewport}
          onViewportChange={handleViewportChange}
        />
      </div>
      {band ? (
        <div className="border-t border-slate-200 bg-slate-50 px-2 py-1 text-[11px]">
          <div className="flex flex-wrap gap-1">
            <SmallNumber label="UPS×" value={upsScale} onChange={setUpsScale} />
            <SmallNumber label="UPS+%" value={upsOffset} onChange={setUpsOffset} />
            <SmallNumber label="LEIPS×" value={leipsScale} onChange={setLeipsScale} />
            <SmallNumber label="LEIPS+%" value={leipsOffset} onChange={setLeipsOffset} />
            <SmallNumber label="Font" value={indicatorFontSize} onChange={setIndicatorFontSize} />
            <SmallNumber
              label="Arrow"
              value={indicatorArrowScale}
              onChange={setIndicatorArrowScale}
            />
            <span className="grid min-w-[160px] flex-1 grid-cols-[1fr_1fr_auto] gap-1">
              <input
                className="min-w-0 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono"
                value={xMin}
                onChange={(event) => {
                  const value = Number(event.currentTarget.value);
                  setXMin(value);
                  setViewport((current) => ({
                    ...current,
                    x: { min: Math.min(value, xMax), max: Math.max(value, xMax) },
                  }));
                }}
              />
              <input
                className="min-w-0 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono"
                value={xMax}
                onChange={(event) => {
                  const value = Number(event.currentTarget.value);
                  setXMax(value);
                  setViewport((current) => ({
                    ...current,
                    x: { min: Math.min(xMin, value), max: Math.max(xMin, value) },
                  }));
                }}
              />
              <button
                className="rounded border border-slate-300 bg-white px-1 py-0.5 font-semibold hover:bg-cyan-50"
                type="button"
                onClick={() => {
                  setXMin(bandXDomain.min);
                  setXMax(bandXDomain.max);
                  setViewport({});
                }}
              >
                Auto
              </button>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IgorBandDiagramPlot({
  band,
  xDomain,
  upsScale,
  upsOffset,
  leipsScale,
  leipsOffset,
  indicatorFontSize,
  indicatorArrowScale,
  viewport,
  onViewportChange,
}: {
  band: BandDiagramResult | undefined;
  xDomain: { min: number; max: number };
  upsScale: number;
  upsOffset: number;
  leipsScale: number;
  leipsOffset: number;
  indicatorFontSize: number;
  indicatorArrowScale: number;
  viewport: BandViewport;
  onViewportChange: (viewport: BandViewport) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const arrowId = useId();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [drag, setDrag] = useState<BandDragState | undefined>();
  const size = { width: 860, height: 620 };
  const plot = { left: 96, top: 58, right: 34, bottom: 96 };
  const plotRight = size.width - plot.right;
  const plotBottom = size.height - plot.bottom;
  const plotWidth = plotRight - plot.left;
  const plotHeight = plotBottom - plot.top;
  const hasData = Boolean(band);
  const model = useMemo(
    () =>
      band
        ? createIgorBandModel({
            band,
            xDomain,
            upsScale,
            upsOffset,
            leipsScale,
            leipsOffset,
            viewport,
            geometry: { left: plot.left, top: plot.top, plotRight, plotBottom },
          })
        : undefined,
    [band, leipsOffset, leipsScale, plotBottom, plotRight, upsOffset, upsScale, viewport, xDomain],
  );
  const selection = drag
    ? selectionRectForBandDrag(
        drag.start,
        clampBandPosition(drag.current, { plotWidth, plotHeight }),
        { width: plotWidth, height: plotHeight },
      )
    : undefined;
  const updateViewport = (next: BandViewport | ((current: BandViewport) => BandViewport)) => {
    onViewportChange(typeof next === "function" ? next(viewport) : next);
  };

  function openPlotMenu(x: number, y: number) {
    openMenu(x, y, [
      {
        type: "item",
        label: "Reset view",
        action: () => updateViewport({}),
      },
      {
        type: "item",
        label: "Export PNG",
        action: () => exportSvgAsPng(svgRef.current, "UPS-LEIPS Band Diagram"),
        disabled: !hasData,
      },
      {
        type: "item",
        label: "Export SVG",
        action: () => exportSvg(svgRef.current, "UPS-LEIPS Band Diagram"),
        disabled: !hasData,
      },
    ]);
  }

  if (!band || !model) {
    return (
      <div
        ref={containerRef}
        className="relative flex h-full w-full items-center justify-center bg-white text-sm text-slate-500"
        onContextMenu={(event) => {
          event.preventDefault();
          openPlotMenu(event.clientX, event.clientY);
        }}
      >
        <div className="rounded border border-slate-300 bg-slate-50 px-4 py-3 text-center">
          <div className="font-semibold text-slate-700">No data</div>
          <div className="mt-1 text-xs">Load CSV data to render this plot.</div>
        </div>
        <ContextMenu menu={menu} onClose={closeMenu} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label="UPS-LEIPS Band Diagram plot"
      className="relative h-full w-full overflow-hidden bg-white select-none"
      onContextMenu={(event) => {
        event.preventDefault();
        openPlotMenu(event.clientX, event.clientY);
      }}
    >
      <svg
        ref={svgRef}
        className="h-full w-full"
        height={size.height}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        style={{ userSelect: "none" }}
        viewBox={`0 0 ${size.width} ${size.height}`}
        width={size.width}
        onDoubleClick={(event) => {
          event.preventDefault();
          updateViewport({});
        }}
        onPointerDown={(event) => {
          if (event.button === 2) {
            event.preventDefault();
            openPlotMenu(event.clientX, event.clientY);
            return;
          }
          if (event.altKey) {
            startBandPan(event, model, viewport, updateViewport);
            return;
          }
          startBandDrag(event, model, setDrag, (start, end) => {
            updateViewport((current) => nextIgorBandViewportAfterDrag(current, model, start, end));
          });
        }}
        onWheel={(event) => {
          if (event.metaKey || event.ctrlKey) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          updateViewport((current) => nextIgorBandViewportAfterWheel(current, model, event));
        }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect height={plotHeight} width={plotWidth} x={plot.left} y={plot.top} />
          </clipPath>
          <marker
            id={arrowId}
            markerHeight="8"
            markerWidth="8"
            orient="auto-start-reverse"
            refX="7"
            refY="4"
            viewBox="0 0 8 8"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="black" />
          </marker>
        </defs>
        <rect fill="white" height={size.height} width={size.width} />
        <rect
          fill="none"
          height={plotHeight}
          stroke="black"
          strokeWidth={3}
          width={plotWidth}
          x={plot.left}
          y={plot.top}
        />
        {selection ? (
          <rect
            fill="rgba(14, 165, 233, 0.12)"
            height={selection.height}
            stroke="#0284c7"
            strokeDasharray="5 4"
            width={selection.width}
            x={plot.left + selection.left}
            y={plot.top + selection.top}
          />
        ) : null}
        <g aria-label="x-axis">
          {model.xTicks.map((tick) => {
            const x = model.xScale(tick);
            return (
              <g key={`x-${tick}`}>
                <line
                  stroke="black"
                  strokeWidth={3}
                  x1={x}
                  x2={x}
                  y1={plotBottom}
                  y2={plotBottom - 30}
                />
                <line
                  stroke="black"
                  strokeWidth={3}
                  x1={x}
                  x2={x}
                  y1={plot.top}
                  y2={plot.top + 30}
                />
                <text
                  fill="black"
                  fontFamily="Arial, Helvetica, sans-serif"
                  fontSize={20}
                  fontWeight={700}
                  textAnchor="middle"
                  x={x}
                  y={plotBottom + 32}
                >
                  {formatNumber(tick, 0)}
                </text>
              </g>
            );
          })}
        </g>
        <text
          fill="black"
          fontSize={38}
          fontWeight={800}
          textAnchor="middle"
          x={plot.left + plotWidth / 2}
          y={size.height - 22}
        >
          Energy relative to E
          <tspan baselineShift="sub" fontSize={26}>
            F
          </tspan>{" "}
          / eV
        </text>
        <text
          fill="black"
          fontSize={38}
          fontWeight={800}
          textAnchor="middle"
          transform={`rotate(-90 42 ${plot.top + plotHeight / 2})`}
          x={42}
          y={plot.top + plotHeight / 2}
        >
          Intensity / a.u.
        </text>
        <text fill="#004cff" fontSize={38} fontWeight={700} x={plot.left + 34} y={plot.top + 66}>
          UPS
        </text>
        <text
          fill="#ff0000"
          fontSize={38}
          fontWeight={700}
          textAnchor="end"
          x={plotRight - 46}
          y={plot.top + 66}
        >
          LEIPS
        </text>
        <g clipPath={`url(#${clipId})`}>
          <path d={model.upsPath ?? undefined} fill="none" stroke="#004cff" strokeWidth={4} />
          <path d={model.leipsPath ?? undefined} fill="none" stroke="#ff0000" strokeWidth={4} />
        </g>
        <BandVerticalLine
          label="VBM"
          labelY={plotBottom - 116}
          model={model}
          value={band.efMinusEvbm}
        />
        <BandVerticalLine
          label="CBM"
          labelY={plotBottom - 116}
          model={model}
          value={band.cbmRelativeToEf}
        />
        <BandVerticalLine
          label={`Vacuum level (${formatNumber(band.vacuumRelativeToEf, 2)} eV)`}
          labelY={plotBottom - 220}
          model={model}
          value={band.vacuumRelativeToEf}
        />
        <BandArrow
          arrowId={arrowId}
          label={`IP=${formatNumber(band.ip, 2)} eV`}
          fontSize={indicatorFontSize}
          arrowScale={indicatorArrowScale}
          model={model}
          x1={band.efMinusEvbm}
          x2={band.vacuumRelativeToEf}
          y={plot.top + 102}
        />
        <BandArrow
          arrowId={arrowId}
          label={`EA= ${formatNumber(band.ea, 2)} eV`}
          fontSize={indicatorFontSize}
          arrowScale={indicatorArrowScale}
          model={model}
          x1={band.cbmRelativeToEf}
          x2={band.vacuumRelativeToEf}
          y={plot.top + 188}
        />
        <BandArrow
          arrowId={arrowId}
          label={
            <>
              E
              <tspan baselineShift="sub" fontSize={26}>
                g
              </tspan>
              = {formatNumber(band.eg, 2)} eV
            </>
          }
          fontSize={indicatorFontSize}
          arrowScale={indicatorArrowScale}
          model={model}
          x1={band.efMinusEvbm}
          x2={band.cbmRelativeToEf}
          y={plot.top + 272}
        />
      </svg>
      <ContextMenu menu={menu} onClose={closeMenu} />
    </div>
  );
}

interface IgorBandModel {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  yRightScale: ScaleLinear<number, number>;
  upsPath: string | null;
  leipsPath: string | null;
  xTicks: number[];
  geometry: BandGeometry;
  xDomain: BandScaleRange;
  yDomain: BandScaleRange;
  yRightDomain: BandScaleRange;
  plotTop: number;
  plotBottom: number;
}

export interface BandScaleRange {
  min: number;
  max: number;
}

export interface BandViewport {
  x?: BandScaleRange;
  y?: BandScaleRange;
  y2?: BandScaleRange;
}

interface BandGeometry {
  left: number;
  top: number;
  plotRight: number;
  plotBottom: number;
  plotWidth: number;
  plotHeight: number;
}

interface BandDragState {
  start: { left: number; top: number };
  current: { left: number; top: number };
}

export function createIgorBandModel(input: {
  band: BandDiagramResult;
  xDomain: { min: number; max: number };
  upsScale: number;
  upsOffset: number;
  leipsScale: number;
  leipsOffset: number;
  viewport?: BandViewport;
  geometry: { left: number; top: number; plotRight: number; plotBottom: number };
}): IgorBandModel {
  const geometry = {
    ...input.geometry,
    plotWidth: input.geometry.plotRight - input.geometry.left,
    plotHeight: input.geometry.plotBottom - input.geometry.top,
  };
  const upsPoints = input.band.upsPoints.map((point) => ({
    x: point.x,
    y: point.y * input.upsScale + offsetFromPercent(input.band.upsPoints, input.upsOffset),
  }));
  const leipsPoints = input.band.leipsPoints.map((point) => ({
    x: point.x,
    y: point.y * input.leipsScale + offsetFromPercent(input.band.leipsPoints, input.leipsOffset),
  }));
  const xDomain = input.viewport?.x ?? input.xDomain;
  const yDomain = input.viewport?.y ?? domainForY(upsPoints);
  const yRightDomain = input.viewport?.y2 ?? domainForY(leipsPoints);
  const xScale = scaleLinear<number, number>()
    .domain([xDomain.min, xDomain.max])
    .range([geometry.plotRight, geometry.left]);
  const upsScale = scaleLinear<number, number>()
    .domain([yDomain.min, yDomain.max])
    .range([geometry.plotBottom, geometry.top]);
  const leipsScale = scaleLinear<number, number>()
    .domain([yRightDomain.min, yRightDomain.max])
    .range([geometry.plotBottom, geometry.top]);
  const pathLine = line<Point>()
    .x((point) => xScale(point.x))
    .y((point) => upsScale(point.y));
  const leipsLine = line<Point>()
    .x((point) => xScale(point.x))
    .y((point) => leipsScale(point.y));

  return {
    xScale,
    yScale: upsScale,
    yRightScale: leipsScale,
    upsPath: pathLine(sortedByX(upsPoints)),
    leipsPath: leipsLine(sortedByX(leipsPoints)),
    xTicks: xScale.ticks(6),
    geometry,
    xDomain,
    yDomain,
    yRightDomain,
    plotTop: geometry.top,
    plotBottom: geometry.plotBottom,
  };
}

function domainForY(points: readonly Point[]): BandScaleRange {
  const values = points.map((point) => point.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  return { min: min - span * 0.02, max: max + span * 0.12 };
}

function offsetFromPercent(points: readonly Point[], percent: number): number {
  if (points.length === 0) {
    return 0;
  }
  const values = points.map((point) => point.y);
  return ((Math.max(...values) - Math.min(...values)) * percent) / 100;
}

function sortedByX(points: readonly Point[]): Point[] {
  return [...points].sort((a, b) => a.x - b.x);
}

function BandVerticalLine({
  model,
  value,
  label,
  labelY,
}: {
  model: IgorBandModel;
  value: number;
  label: string;
  labelY: number;
}) {
  const x = model.xScale(value);
  return (
    <g>
      <line
        stroke="black"
        strokeDasharray="14 10"
        strokeWidth={3}
        x1={x}
        x2={x}
        y1={model.plotTop + 90}
        y2={model.plotBottom - 8}
      />
      <text
        fill="black"
        fontSize={32}
        textAnchor="middle"
        transform={`rotate(90 ${x + 12} ${labelY})`}
        x={x + 12}
        y={labelY}
      >
        {label}
      </text>
    </g>
  );
}

function BandArrow({
  model,
  x1,
  x2,
  y,
  label,
  arrowId,
  fontSize,
  arrowScale,
}: {
  model: IgorBandModel;
  x1: number;
  x2: number;
  y: number;
  label: ReactNode;
  arrowId: string;
  fontSize: number;
  arrowScale: number;
}) {
  const left = model.xScale(x1);
  const right = model.xScale(x2);
  const start = Math.min(left, right);
  const end = Math.max(left, right);
  return (
    <g>
      <line
        markerEnd={`url(#${arrowId})`}
        markerStart={`url(#${arrowId})`}
        stroke="black"
        strokeWidth={Math.max(1, 3 * arrowScale)}
        x1={start}
        x2={end}
        y1={y}
        y2={y}
      />
      <text fill="black" fontSize={fontSize} textAnchor="middle" x={(start + end) / 2} y={y - 18}>
        {label}
      </text>
    </g>
  );
}

function scaledFilename(title: string, extension: string): string {
  return `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${extension}`;
}

function exportSvg(svg: SVGSVGElement | null, title: string): void {
  if (!svg) {
    return;
  }
  const serialized = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([serialized], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  download(scaledFilename(title, "svg"), url);
  URL.revokeObjectURL(url);
}

function exportSvgAsPng(svg: SVGSVGElement | null, title: string): void {
  if (!svg) {
    return;
  }
  const serialized = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([serialized], { type: "image/svg+xml" }));
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = svg.viewBox.baseVal.width;
    canvas.height = svg.viewBox.baseVal.height;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      download(scaledFilename(title, "png"), canvas.toDataURL("image/png"));
    }
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

function download(filename: string, href: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}

function startBandDrag(
  event: ReactPointerEvent<SVGSVGElement>,
  model: IgorBandModel,
  setDrag: (drag: BandDragState | undefined) => void,
  onComplete: (start: { left: number; top: number }, end: { left: number; top: number }) => void,
): void {
  event.preventDefault();
  const svg = event.currentTarget;
  const start = eventPositionInBandPlot(event, model, svg);
  setDrag({ start, current: start });
  svg.setPointerCapture?.(event.pointerId);
  const handleMove = (moveEvent: PointerEvent) => {
    setDrag({
      start,
      current: eventPositionInBandPlot(moveEvent, model, svg),
    });
  };
  const handleUp = (upEvent: PointerEvent) => {
    const end = eventPositionInBandPlot(upEvent, model, svg);
    setDrag(undefined);
    onComplete(start, end);
    svg.releasePointerCapture?.(event.pointerId);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };
  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
}

function startBandPan(
  event: ReactPointerEvent<SVGSVGElement>,
  model: IgorBandModel,
  viewport: BandViewport,
  updateViewport: (next: BandViewport) => void,
): void {
  event.preventDefault();
  const svg = event.currentTarget;
  const start = eventPositionInBandPlot(event, model, svg);
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
): { left: number; top: number } {
  const svgLike = svg as SVGSVGElement & { createSVGPoint?: SVGSVGElement["createSVGPoint"] };
  if (typeof svgLike.createSVGPoint !== "function") {
    const rect = svg.getBoundingClientRect();
    const scaleX = 860 / Math.max(rect.width, 1);
    const scaleY = 620 / Math.max(rect.height, 1);
    return clampBandPosition(
      {
        left: (event.clientX - rect.left) * scaleX - model.geometry.left,
        top: (event.clientY - rect.top) * scaleY - model.geometry.top,
      },
      model.geometry,
    );
  }
  const point = svgLike.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    return { left: 0, top: 0 };
  }
  const transformed = point.matrixTransform(matrix.inverse());
  return clampBandPosition(
    {
      left: transformed.x - model.geometry.left,
      top: transformed.y - model.geometry.top,
    },
    model.geometry,
  );
}

function clampBandPosition(
  position: { left: number; top: number },
  geometry: Pick<BandGeometry, "plotWidth" | "plotHeight">,
): { left: number; top: number } {
  return {
    left: Math.min(Math.max(position.left, 0), geometry.plotWidth),
    top: Math.min(Math.max(position.top, 0), geometry.plotHeight),
  };
}

function selectionRectForBandDrag(
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

function SmallNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label
      className="grid min-w-[104px] grid-cols-[50px_1fr] items-center gap-1 rounded border border-slate-200 bg-white px-1 py-0.5"
      onWheel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const baseStep = label === "Font" ? 1 : label === "Arrow" ? 0.1 : 0.1;
        const step = event.shiftKey ? baseStep * 10 : baseStep;
        const direction = event.deltaY < 0 ? 1 : -1;
        onChange(Number((value + direction * step).toFixed(4)));
      }}
    >
      <span className="font-semibold text-slate-500">{label}</span>
      <input
        className="min-w-0 bg-transparent font-mono text-slate-900 outline-none"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}
