import { formatTickParts, type PlotGeometry, type PlotScales } from "./SpectrumPlotModel";

export function PlotAxes({
  geometry,
  hideYTicks,
  largeAxisLabels,
  scales,
  xLabel,
  xLabelBottomPadding,
  yLabel,
  yRightLabel,
}: {
  geometry: PlotGeometry;
  hideYTicks: boolean;
  largeAxisLabels: boolean;
  scales: PlotScales;
  xLabel: string;
  xLabelBottomPadding?: number;
  yLabel: string;
  yRightLabel?: string;
}) {
  const xTicks = scales.xScale.ticks(7);
  const yTicks = scales.yScale.ticks(5);
  const yRightTicks = scales.yRightScale?.ticks(5) ?? [];
  const axisColor = "#000000";
  const labelSize = largeAxisLabels ? 24 : 15;
  const labelWeight = largeAxisLabels ? 800 : 700;
  return (
    <g>
      {xTicks.map((tick) => {
        const x = scales.xScale(tick);
        return (
          <g key={`x-${tick}`}>
            <line
              stroke={axisColor}
              x1={x}
              x2={x}
              y1={geometry.plotBottom - 6}
              y2={geometry.plotBottom}
            />
            <text
              fill={axisColor}
              fontSize={12}
              textAnchor="middle"
              x={x}
              y={geometry.plotBottom + 20}
            >
              <TickLabel value={tick} />
            </text>
          </g>
        );
      })}
      {!hideYTicks
        ? yTicks.map((tick) => {
            const y = scales.yScale(tick);
            return (
              <g key={`y-${tick}`}>
                <line stroke={axisColor} x1={geometry.left} x2={geometry.left + 6} y1={y} y2={y} />
                <text
                  fill={axisColor}
                  fontSize={12}
                  textAnchor="end"
                  x={geometry.left - 12}
                  y={y + 4}
                >
                  <TickLabel value={tick} />
                </text>
              </g>
            );
          })
        : null}
      {!hideYTicks && scales.yRightScale
        ? yRightTicks.map((tick) => {
            const y = scales.yRightScale?.(tick) ?? 0;
            return (
              <g key={`y2-${tick}`}>
                <line
                  stroke="#dc2626"
                  x1={geometry.plotRight - 6}
                  x2={geometry.plotRight}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#dc2626"
                  fontSize={12}
                  textAnchor="start"
                  x={geometry.plotRight + 12}
                  y={y + 4}
                >
                  <TickLabel value={tick} />
                </text>
              </g>
            );
          })
        : null}
      <rect
        fill="none"
        height={geometry.plotHeight}
        stroke={axisColor}
        strokeWidth={1}
        width={geometry.plotWidth}
        x={geometry.left}
        y={geometry.top}
      />
      <text
        fill={axisColor}
        fontSize={largeAxisLabels ? 22 : 14}
        fontWeight={labelWeight}
        textAnchor="middle"
        x={geometry.left + geometry.plotWidth / 2}
        y={geometry.height - (xLabelBottomPadding ?? (largeAxisLabels ? 8 : 4))}
      >
        <AxisLabelText label={xLabel} largeAxisLabels={largeAxisLabels} />
      </text>
      <text
        fill={axisColor}
        fontSize={labelSize}
        fontWeight={labelWeight}
        textAnchor="middle"
        transform={`rotate(-90 ${largeAxisLabels ? 28 : 18} ${geometry.top + geometry.plotHeight / 2})`}
        x={largeAxisLabels ? 28 : 18}
        y={geometry.top + geometry.plotHeight / 2}
      >
        <AxisLabelText label={yLabel} largeAxisLabels={largeAxisLabels} />
      </text>
      {yRightLabel ? (
        <text
          fill="#dc2626"
          fontSize={labelSize}
          fontWeight={labelWeight}
          textAnchor="middle"
          transform={`rotate(90 ${geometry.width - (largeAxisLabels ? 28 : 22)} ${geometry.top + geometry.plotHeight / 2})`}
          x={geometry.width - (largeAxisLabels ? 28 : 22)}
          y={geometry.top + geometry.plotHeight / 2}
        >
          {yRightLabel}
        </text>
      ) : null}
    </g>
  );
}

function AxisLabelText({ label, largeAxisLabels }: { label: string; largeAxisLabels: boolean }) {
  if (label === "Energy from Evac. / eV") {
    return (
      <>
        Energy from E
        <tspan baselineShift="sub" fontSize={largeAxisLabels ? 16 : 10}>
          vac.
        </tspan>{" "}
        / eV
      </>
    );
  }
  if (label === "Applied Bias Vbias / V") {
    return (
      <>
        Applied Bias V
        <tspan baselineShift="sub" fontSize={largeAxisLabels ? 16 : 10}>
          bias
        </tspan>{" "}
        / V
      </>
    );
  }
  if (label === "Binding energy of Ecut-off / eV") {
    return (
      <>
        Binding energy of E
        <tspan baselineShift="sub" fontSize={largeAxisLabels ? 16 : 10}>
          cut-off
        </tspan>{" "}
        / eV
      </>
    );
  }
  if (label === "Binding energy of EVBM / eV") {
    return (
      <>
        Binding energy of E
        <tspan baselineShift="sub" fontSize={largeAxisLabels ? 16 : 10}>
          VBM
        </tspan>{" "}
        / eV
      </>
    );
  }
  return label;
}

function TickLabel({ value }: { value: number }) {
  const formatted = formatTickParts(value);
  if (!formatted.exponent) {
    return <>{formatted.mantissa}</>;
  }
  return (
    <>
      {formatted.mantissa}
      <tspan>×10</tspan>
      <tspan baselineShift="super" fontSize="8">
        {formatted.exponent}
      </tspan>
    </>
  );
}
