import { useMemo } from "react";
import { calculateBiasDependence } from "../../domain/analysis";
import type { UPSIPResult } from "../../domain/types";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import type { PlotSeries } from "../plotData";
import { SpectrumPlot, type PlotViewport } from "./SpectrumPlot";
import { BIAS_PLOTS } from "./UPSPlotModel";

export function UPSBiasDependenceWindow() {
  const project = useProjectStore((state) => state.project);
  const setUpsBiasPlotViewport = useProjectStore((state) => state.setUpsBiasPlotViewport);
  const ipResults = project.analysis.ups?.ipResults ?? [];
  const viewports = project.ui?.upsBiasPlotViewports ?? {};
  return (
    <div className="grid h-full grid-cols-3 gap-3 bg-white p-3">
      {BIAS_PLOTS.map((config) => (
        <BiasDependencePlot
          key={config.id}
          config={config}
          ipResults={ipResults}
          viewport={viewports[config.id] ?? {}}
          onViewportChange={(viewport) => setUpsBiasPlotViewport(config.id, viewport)}
        />
      ))}
    </div>
  );
}

function BiasDependencePlot({
  config,
  ipResults,
  viewport,
  onViewportChange,
}: {
  config: (typeof BIAS_PLOTS)[number];
  ipResults: readonly UPSIPResult[];
  viewport: PlotViewport;
  onViewportChange: (viewport: PlotViewport) => void;
}) {
  const points = ipResults.map((result) => ({
    x: result.appliedVoltage,
    y: result[config.field],
  }));
  const dependence = calculateBiasDependence(
    points.map((point) => ({ voltage: point.x, value: point.y })),
  );
  const series = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [
      {
        name: config.label,
        color: config.color,
        points,
        width: 0,
        pointRadius: 3.5,
      },
    ];
    if (dependence && points.length >= 2) {
      const min = Math.min(...points.map((point) => point.x));
      const max = Math.max(...points.map((point) => point.x));
      items.push({
        name: "linear fit",
        color: config.color,
        points: [
          { x: min, y: dependence.slope * min + dependence.intercept },
          { x: max, y: dependence.slope * max + dependence.intercept },
        ],
        dash: [5, 3],
        width: 1.5,
        affectsScale: false,
        fitLabel: `y = ${formatNumber(dependence.slope, 3)}x + ${formatNumber(
          dependence.intercept,
          3,
        )} eV`,
      });
    }
    return items;
  }, [config.color, config.label, dependence, points]);
  const viewportKey = JSON.stringify(viewport);
  return (
    <div className="min-w-0">
      <div className="aspect-[4/3] w-full">
        <SpectrumPlot
          title={`UPS Bias Dependence ${config.id}`}
          xLabel="Applied Bias Vbias / V"
          yLabel={config.label}
          series={series}
          marginVariant="bias"
          xLabelBottomPadding={10}
          viewportRequest={{ id: `${config.id}-${viewportKey}`, viewport }}
          onViewportChange={onViewportChange}
        />
      </div>
    </div>
  );
}
