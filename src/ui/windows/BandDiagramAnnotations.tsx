import type { ReactNode } from "react";
import type { IgorBandModel } from "./bandDiagramModel";

export function BandVerticalLine({
  model,
  value,
  label,
  labelY,
  fontSize,
}: {
  model: IgorBandModel;
  value: number;
  label: string;
  labelY: number;
  fontSize: number;
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
        fontSize={fontSize}
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

export function BandArrow({
  model,
  x1,
  x2,
  y,
  label,
  arrowId,
  arrowHead = "both",
  fontSize,
  arrowScale,
}: {
  model: IgorBandModel;
  x1: number;
  x2: number;
  y: number;
  label: ReactNode;
  arrowId: string;
  arrowHead?: BandArrowHead;
  fontSize: number;
  arrowScale: number;
}) {
  const left = model.xScale(x1);
  const right = model.xScale(x2);
  const start = Math.min(left, right);
  const end = Math.max(left, right);
  const markers = bandArrowMarkerProps(arrowId, arrowHead);
  return (
    <g>
      <line
        markerEnd={markers.markerEnd}
        markerStart={markers.markerStart}
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

export type BandArrowHead = "both" | "left";

export function bandArrowMarkerProps(arrowId: string, arrowHead: BandArrowHead) {
  return {
    markerEnd: arrowHead === "both" ? `url(#${arrowId})` : undefined,
    markerStart: `url(#${arrowId})`,
  };
}
