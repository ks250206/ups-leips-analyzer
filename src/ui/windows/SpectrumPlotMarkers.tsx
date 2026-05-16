import type { ScaleLinear } from "d3-scale";
import type { PlotAnnotation, PlotMarker } from "../plotData";
import type { PlotGeometry } from "./SpectrumPlotModel";

export function MarkerLine({
  geometry,
  marker,
  xScale,
}: {
  geometry: PlotGeometry;
  marker: PlotMarker;
  xScale: ScaleLinear<number, number>;
}) {
  const x = xScale(marker.x);
  return (
    <g>
      <line
        stroke={marker.color}
        strokeDasharray="5 4"
        x1={x}
        x2={x}
        y1={geometry.top}
        y2={geometry.plotBottom}
      />
      {marker.label ? (
        <text fill={marker.color} fontSize={12} x={x + 4} y={geometry.top + 16}>
          {marker.label}
        </text>
      ) : null}
    </g>
  );
}

export function PlotAnnotations({
  annotations,
  geometry,
  xScale,
}: {
  annotations: readonly PlotAnnotation[];
  geometry: PlotGeometry;
  xScale: ScaleLinear<number, number>;
}) {
  return (
    <g>
      {annotations.map((annotation, index) => {
        if (annotation.type === "text") {
          return (
            <text
              key={`text-${annotation.label}-${index}`}
              fill={annotation.color}
              fontSize={annotation.fontSize ?? 30}
              fontWeight={700}
              textAnchor={annotation.anchor ?? "middle"}
              x={geometry.left + geometry.plotWidth * annotation.xFraction}
              y={geometry.top + geometry.plotHeight * annotation.yFraction}
            >
              {annotation.label}
            </text>
          );
        }
        const x1 = xScale(annotation.x1);
        const x2 = xScale(annotation.x2);
        const y = geometry.top + geometry.plotHeight * annotation.yFraction;
        return (
          <g key={`arrow-${index}`}>
            <line
              markerEnd="url(#plot-arrow)"
              stroke={annotation.color}
              strokeWidth={annotation.strokeWidth ?? 1.8}
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
            />
            <text
              fill={annotation.color}
              fontSize={annotation.fontSize ?? 24}
              fontWeight={700}
              textAnchor="middle"
              x={(x1 + x2) / 2}
              y={y - 10}
            >
              {annotation.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
