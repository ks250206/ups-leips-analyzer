import type { ScaleLinear } from "d3-scale";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { FitRange } from "../../domain/types";
import type { PlotRangeBand, PlotSeries } from "../plotData";
import type { PlotGeometry } from "./SpectrumPlotModel";
import { singlePointForBand } from "./SpectrumPlotCursorModel";
import { clamp } from "./SpectrumPlotSeries";

export function HorizontalSinglePointLines({
  geometry,
  rangeBands,
  series,
  yScale,
  yRightScale,
}: {
  geometry: PlotGeometry;
  rangeBands: readonly PlotRangeBand[];
  series: readonly PlotSeries[];
  yScale: ScaleLinear<number, number>;
  yRightScale?: ScaleLinear<number, number>;
}) {
  return (
    <g>
      {rangeBands.map((band) => {
        const point = singlePointForBand(series, band, yScale, yRightScale);
        if (!point) {
          return null;
        }
        const y = clamp(point.yPosition, geometry.top, geometry.plotBottom);
        return (
          <line
            key={`${band.id ?? band.label}-horizontal`}
            stroke={band.color}
            strokeDasharray="6 4"
            strokeWidth={1.4}
            x1={geometry.left}
            x2={geometry.plotRight}
            y1={y}
            y2={y}
          />
        );
      })}
    </g>
  );
}

export function CursorSinglePointMarkers({
  geometry,
  onRangeBandChange,
  rangeBands,
  series,
  xScale,
  yScale,
  yRightScale,
}: {
  geometry: PlotGeometry;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
  rangeBands: readonly PlotRangeBand[];
  series: readonly PlotSeries[];
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  yRightScale?: ScaleLinear<number, number>;
}) {
  return (
    <g>
      {rangeBands.map((band) => {
        const point = singlePointForBand(series, band, yScale, yRightScale);
        if (!point) {
          return null;
        }
        const xPosition = xScale(point.x);
        const yPosition = clamp(point.yPosition, geometry.top, geometry.plotBottom);
        return (
          <g key={`${band.id ?? band.label}-single`}>
            <line
              stroke={band.color}
              strokeWidth={1.2}
              x1={xPosition - 5}
              x2={xPosition + 5}
              y1={yPosition}
              y2={yPosition}
            />
            <line
              stroke={band.color}
              strokeWidth={1.2}
              x1={xPosition}
              x2={xPosition}
              y1={yPosition - 5}
              y2={yPosition + 5}
            />
            <rect
              aria-label={`${band.label} single point cursor`}
              className="cursor-ew-resize"
              fill={band.color}
              height={14}
              rx={3}
              width={24}
              x={xPosition - 12}
              y={Math.max(geometry.top + 2, yPosition - 21)}
            />
            <text
              fill="white"
              fontSize={9}
              fontWeight={800}
              pointerEvents="none"
              textAnchor="middle"
              x={xPosition}
              y={Math.max(geometry.top + 13, yPosition - 10)}
            >
              {band.label}
            </text>
            <rect
              className="cursor-ew-resize"
              fill="transparent"
              height={28}
              role="button"
              width={28}
              x={xPosition - 14}
              y={yPosition - 14}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                startSinglePointDrag(event, geometry, xScale, band, onRangeBandChange);
              }}
            />
          </g>
        );
      })}
    </g>
  );
}

function startSinglePointDrag(
  event: ReactPointerEvent<SVGRectElement>,
  geometry: PlotGeometry,
  xScale: ScaleLinear<number, number>,
  band: PlotRangeBand,
  onRangeBandChange: ((bandId: string, range: FitRange) => void) | undefined,
): void {
  if (!band.id || !onRangeBandChange) {
    return;
  }
  const svg = event.currentTarget.ownerSVGElement;
  if (!svg) {
    return;
  }
  const width = Math.abs(band.max - band.min);
  const update = (moveEvent: PointerEvent | ReactPointerEvent<SVGRectElement>) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = geometry.width / Math.max(rect.width, 1);
    const left = (moveEvent.clientX - rect.left) * scaleX;
    const x = xScale.invert(left);
    onRangeBandChange(band.id ?? "", { min: x - width / 2, max: x + width / 2 });
  };
  update(event);
  const move = (moveEvent: PointerEvent) => update(moveEvent);
  const cleanup = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", cleanup);
    window.removeEventListener("pointercancel", cleanup);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", cleanup, { once: true });
  window.addEventListener("pointercancel", cleanup, { once: true });
}
