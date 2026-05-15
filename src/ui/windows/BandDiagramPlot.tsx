import { useId, useMemo, useRef, useState } from "react";
import type { BandDiagramResult } from "../../domain/types";
import { ContextMenu, useContextMenu } from "../ContextMenu";
import { formatNumber, formatSignificant } from "../format";
import { copyPng, exportPng, exportSvg } from "./plotExport";
import { BandArrow, BandVerticalLine } from "./BandDiagramAnnotations";
import { type BandDragState, type BandViewport, createIgorBandModel } from "./bandDiagramModel";
import {
  clampBandPosition,
  nextIgorBandViewportAfterDrag,
  nextIgorBandViewportAfterWheel,
  selectionRectForBandDrag,
  startBandDrag,
  startBandPan,
} from "./bandDiagramInteraction";

export function IgorBandDiagramPlot({
  band,
  xDomain,
  upsScale,
  upsOffset,
  leipsScale,
  leipsOffset,
  indicatorFontSize,
  indicatorArrowScale,
  significantDigits,
  viewport,
  onResetView,
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
  significantDigits: number;
  viewport: BandViewport;
  onResetView: () => void;
  onViewportChange: (viewport: BandViewport) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const arrowId = useId();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [drag, setDrag] = useState<BandDragState | undefined>();
  const size = { width: 860, height: 700 };
  const plot = { left: 96, top: 58, right: 34, bottom: 94 };
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
      { type: "item", label: "Reset view", action: onResetView },
      {
        type: "item",
        label: "Copy PNG",
        action: () => copyPng(svgRef.current),
        disabled: !hasData,
      },
      {
        type: "item",
        label: "Export PNG",
        action: () => exportPng(svgRef.current, "UPS-LEIPS Band Diagram"),
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
          onResetView();
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
                  fontSize={30}
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
          transform={`rotate(-90 58 ${plot.top + plotHeight / 2})`}
          x={58}
          y={plot.top + plotHeight / 2}
        >
          Intensity / a.u.
        </text>
        <g clipPath={`url(#${clipId})`}>
          <path d={model.upsPath ?? undefined} fill="none" stroke="#004cff" strokeWidth={4} />
          <path d={model.leipsPath ?? undefined} fill="none" stroke="#ff0000" strokeWidth={4} />
        </g>
        <text
          fill="#004cff"
          fontSize={38}
          fontWeight={700}
          paintOrder="stroke fill"
          stroke="white"
          strokeLinejoin="round"
          strokeWidth={18}
          x={plot.left + 34}
          y={plot.top + 66}
        >
          UPS
        </text>
        <text
          fill="#ff0000"
          fontSize={38}
          fontWeight={700}
          paintOrder="stroke fill"
          stroke="white"
          strokeLinejoin="round"
          strokeWidth={18}
          textAnchor="end"
          x={plotRight - 46}
          y={plot.top + 66}
        >
          LEIPS
        </text>
        <BandVerticalLine
          fontSize={indicatorFontSize}
          label="VBM"
          labelY={plotBottom - 116}
          model={model}
          value={band.efMinusEvbm}
        />
        <BandVerticalLine
          fontSize={indicatorFontSize}
          label="CBM"
          labelY={plotBottom - 116}
          model={model}
          upperOffset={160}
          value={band.cbmRelativeToEf}
        />
        <BandVerticalLine
          fontSize={indicatorFontSize}
          label={`Vacuum level (${formatSignificant(band.vacuumRelativeToEf, significantDigits)} eV)`}
          labelY={plotBottom - 220}
          model={model}
          value={band.vacuumRelativeToEf}
        />
        <BandArrow
          arrowId={arrowId}
          arrowHead="left"
          label={`IP=${formatSignificant(band.ip, significantDigits)} eV`}
          fontSize={indicatorFontSize}
          arrowScale={indicatorArrowScale}
          model={model}
          x1={band.efMinusEvbm}
          x2={band.vacuumRelativeToEf}
          y={plot.top + 102}
        />
        <BandArrow
          arrowId={arrowId}
          arrowHead="left"
          label={`EA= ${formatSignificant(band.ea, significantDigits)} eV`}
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
              <tspan baselineShift="sub" fontSize={Math.max(10, indicatorFontSize * 0.65)}>
                g
              </tspan>
              = {formatSignificant(band.eg, significantDigits)} eV
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
