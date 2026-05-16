import type { ScaleLinear } from "d3-scale";
import type { FitRange } from "../../domain/types";
import type { PlotRangeBand, PlotSeries } from "../plotData";
import {
  startHandleDrag,
  startRangeBandDrag,
  withAlpha,
  type PlotGeometry,
} from "./SpectrumPlotModel";
import { cursorYForValue, seriesForCursorBand } from "./SpectrumPlotCursorModel";

export function RangeBand({
  band,
  geometry,
  onRangeBandChange,
  xScale,
}: {
  band: PlotRangeBand;
  geometry: PlotGeometry;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
  xScale: ScaleLinear<number, number>;
}) {
  const x0 = xScale(Math.min(band.min, band.max));
  const x1 = xScale(Math.max(band.min, band.max));
  const left = Math.min(x0, x1);
  const width = Math.abs(x1 - x0);
  return (
    <g>
      <rect
        className={band.id && onRangeBandChange ? "cursor-grab active:cursor-grabbing" : undefined}
        fill={withAlpha(band.color, 0.055)}
        height={geometry.plotHeight}
        width={width}
        x={left}
        y={geometry.top}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          startRangeBandDrag(event, geometry, xScale, band, onRangeBandChange);
        }}
      />
      <text fill={band.color} fontSize={11} x={left + 4} y={geometry.plotBottom - 8}>
        {band.label}
      </text>
    </g>
  );
}

export function CursorHandles({
  band,
  geometry,
  xScale,
  onRangeBandChange,
}: {
  band: PlotRangeBand;
  geometry: PlotGeometry;
  xScale: ScaleLinear<number, number>;
  onRangeBandChange?: (bandId: string, range: FitRange) => void;
}) {
  if (!band.id) {
    return null;
  }
  return (
    <g>
      {[
        { value: band.min, side: "min" as const },
        { value: band.max, side: "max" as const },
      ].map((handle) => {
        const x = xScale(handle.value);
        return (
          <g key={`${band.id}-${handle.side}`}>
            <rect
              aria-label={`${band.label} ${handle.side} cursor`}
              className="cursor-ew-resize"
              fill="transparent"
              height={geometry.plotHeight}
              role="button"
              width={14}
              x={x - 7}
              y={geometry.top}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                startHandleDrag(event, geometry, xScale, band, handle.side, onRangeBandChange);
              }}
            />
          </g>
        );
      })}
    </g>
  );
}

export function CursorPointMarkers({
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
  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let labelIndex = 0;
  return (
    <g>
      {rangeBands.flatMap((band) =>
        [
          { value: band.min, side: "min" as const },
          { value: band.max, side: "max" as const },
        ].map((handle) => {
          const label = labels[labelIndex] ?? `${labelIndex + 1}`;
          labelIndex += 1;
          const targetSeries = seriesForCursorBand(series, band);
          const y = cursorYForValue(targetSeries, handle.value);
          const scale = targetSeries?.yAxis === "right" && yRightScale ? yRightScale : yScale;
          const xPosition = xScale(handle.value);
          const yPosition = Math.min(Math.max(scale(y), geometry.top), geometry.plotBottom);
          return (
            <g key={`${band.id ?? band.label}-${handle.side}-${label}`}>
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
                aria-label={`${label} cursor`}
                className="cursor-ew-resize"
                fill={band.color}
                height={14}
                rx={3}
                width={14}
                x={xPosition - 7}
                y={Math.max(geometry.top + 2, yPosition - 21)}
              />
              <text
                fill="white"
                fontSize={10}
                fontWeight={800}
                pointerEvents="none"
                textAnchor="middle"
                x={xPosition}
                y={Math.max(geometry.top + 13, yPosition - 10)}
              >
                {label}
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
                  startHandleDrag(event, geometry, xScale, band, handle.side, onRangeBandChange);
                }}
              />
            </g>
          );
        }),
      )}
    </g>
  );
}
