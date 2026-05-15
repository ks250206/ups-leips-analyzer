import { scaleLinear, type ScaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
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

  useEffect(() => {
    setXMin(bandXDomain.min);
    setXMax(bandXDomain.max);
  }, [bandXDomain.min, bandXDomain.max]);

  return (
    <div className="flex h-full flex-col bg-white">
      {band ? (
        <div className="border-b border-slate-200 bg-slate-50 px-2 py-1 text-[11px]">
          <div className="grid grid-cols-5 gap-1">
            <Metric label="Vac" value={band.vacuumRelativeToEf} />
            <Metric label="VBM" value={band.efMinusEvbm} />
            <Metric label="CBM" value={band.cbmRelativeToEf} />
            <Metric label="IP" value={band.ip} />
            <Metric
              label="EA / Eg"
              text={`${formatNumber(band.ea, 2)} / ${formatNumber(band.eg, 2)} eV`}
            />
          </div>
          <div className="mt-1 grid grid-cols-5 gap-1">
            <SmallNumber label="UPS×" value={upsScale} onChange={setUpsScale} />
            <SmallNumber label="UPS+" value={upsOffset} onChange={setUpsOffset} />
            <SmallNumber label="LEIPS×" value={leipsScale} onChange={setLeipsScale} />
            <SmallNumber label="LEIPS+" value={leipsOffset} onChange={setLeipsOffset} />
            <span className="grid grid-cols-[1fr_1fr_auto] gap-1">
              <input
                className="min-w-0 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono"
                value={xMin}
                onChange={(event) => setXMin(Number(event.currentTarget.value))}
              />
              <input
                className="min-w-0 rounded border border-slate-200 bg-white px-1 py-0.5 font-mono"
                value={xMax}
                onChange={(event) => setXMax(Number(event.currentTarget.value))}
              />
              <button
                className="rounded border border-slate-300 bg-white px-1 py-0.5 font-semibold hover:bg-cyan-50"
                type="button"
                onClick={() => {
                  setXMin(bandXDomain.min);
                  setXMax(bandXDomain.max);
                }}
              >
                Auto
              </button>
            </span>
          </div>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <IgorBandDiagramPlot
          band={band}
          xDomain={{ min: Math.min(xMin, xMax), max: Math.max(xMin, xMax) }}
          upsScale={upsScale}
          upsOffset={upsOffset}
          leipsScale={leipsScale}
          leipsOffset={leipsOffset}
        />
      </div>
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
}: {
  band: BandDiagramResult | undefined;
  xDomain: { min: number; max: number };
  upsScale: number;
  upsOffset: number;
  leipsScale: number;
  leipsOffset: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const arrowId = useId();
  const { menu, openMenu, closeMenu } = useContextMenu();
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
            geometry: { left: plot.left, top: plot.top, plotRight, plotBottom },
          })
        : undefined,
    [band, leipsOffset, leipsScale, plotBottom, plotRight, upsOffset, upsScale, xDomain],
  );

  function openPlotMenu(x: number, y: number) {
    openMenu(x, y, [
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
          <div className="mt-1 text-xs">Load CSV or Demo data to render this plot.</div>
        </div>
        <ContextMenu menu={menu} onClose={closeMenu} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label="UPS-LEIPS Band Diagram plot"
      className="relative h-full w-full overflow-hidden bg-white"
      onContextMenu={(event) => {
        event.preventDefault();
        openPlotMenu(event.clientX, event.clientY);
      }}
    >
      <svg
        ref={svgRef}
        className="h-full w-full"
        height={size.height}
        role="img"
        viewBox={`0 0 ${size.width} ${size.height}`}
        width={size.width}
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
                  fontSize={34}
                  fontWeight={700}
                  textAnchor="middle"
                  x={x}
                  y={plotBottom + 58}
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
          model={model}
          x1={band.efMinusEvbm}
          x2={band.vacuumRelativeToEf}
          y={plot.top + 102}
        />
        <BandArrow
          arrowId={arrowId}
          label={`EA= ${formatNumber(band.ea, 2)} eV`}
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
  upsPath: string | null;
  leipsPath: string | null;
  xTicks: number[];
  plotTop: number;
  plotBottom: number;
}

export function createIgorBandModel(input: {
  band: BandDiagramResult;
  xDomain: { min: number; max: number };
  upsScale: number;
  upsOffset: number;
  leipsScale: number;
  leipsOffset: number;
  geometry: { left: number; top: number; plotRight: number; plotBottom: number };
}): IgorBandModel {
  const upsPoints = input.band.upsPoints.map((point) => ({
    x: point.x,
    y: point.y * input.upsScale + input.upsOffset,
  }));
  const leipsPoints = input.band.leipsPoints.map((point) => ({
    x: point.x,
    y: point.y * input.leipsScale + input.leipsOffset,
  }));
  const xScale = scaleLinear<number, number>()
    .domain([input.xDomain.min, input.xDomain.max])
    .range([input.geometry.plotRight, input.geometry.left]);
  const upsScale = makeYScale(upsPoints, input.geometry);
  const leipsScale = makeYScale(leipsPoints, input.geometry);
  const pathLine = line<Point>()
    .x((point) => xScale(point.x))
    .y((point) => upsScale(point.y));
  const leipsLine = line<Point>()
    .x((point) => xScale(point.x))
    .y((point) => leipsScale(point.y));

  return {
    xScale,
    upsPath: pathLine(sortedByX(upsPoints)),
    leipsPath: leipsLine(sortedByX(leipsPoints)),
    xTicks: xScale.ticks(6),
    plotTop: input.geometry.top,
    plotBottom: input.geometry.plotBottom,
  };
}

function makeYScale(
  points: readonly Point[],
  geometry: { top: number; plotBottom: number },
): ScaleLinear<number, number> {
  const values = points.map((point) => point.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  return scaleLinear<number, number>()
    .domain([min - span * 0.02, max + span * 0.12])
    .range([geometry.plotBottom, geometry.top]);
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
}: {
  model: IgorBandModel;
  x1: number;
  x2: number;
  y: number;
  label: ReactNode;
  arrowId: string;
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
        strokeWidth={3}
        x1={start}
        x2={end}
        y1={y}
        y2={y}
      />
      <text fill="black" fontSize={34} textAnchor="middle" x={(start + end) / 2} y={y - 18}>
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
      className="grid grid-cols-[42px_1fr] items-center gap-1 rounded border border-slate-200 bg-white px-1 py-0.5"
      onWheel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const baseStep = label.includes("×") ? 0.1 : 0.1;
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

function Metric({ label, value, text }: { label: string; value?: number; text?: string }) {
  return (
    <div className="truncate rounded border border-slate-200 bg-white px-2 py-1">
      <span className="mr-1 font-semibold text-slate-500">{label}</span>
      <span className="font-mono text-slate-900">{text ?? `${formatNumber(value, 2)} eV`}</span>
    </div>
  );
}
