import { useMemo } from "react";
import type { FitTarget } from "../../domain/types";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import {
  datasetSeries,
  lineFitSeries,
  type PlotMarker,
  type PlotRangeBand,
  type PlotSeries,
  xExtent,
} from "../plotData";
import { SpectrumPlot } from "./SpectrumPlot";
import { vbTarget } from "./UPSPlotModel";

export function UPSVBPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const setUpsVbPlotViewport = useProjectStore((state) => state.setUpsVbPlotViewport);
  const setPlotCursorStyle = useProjectStore((state) => state.setPlotCursorStyle);
  const vbDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.upsVbDatasetId,
  );
  const ups = project.analysis.ups;
  const persistedViewport = project.ui?.upsVbPlotViewport ?? {};
  const persistedViewportKey = JSON.stringify(persistedViewport);

  const series = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [];
    if (vbDataset) {
      items.push(datasetSeries(vbDataset, "#2563eb"));
    }
    if (ups) {
      const extent = vbDataset ? xExtent(vbDataset.points) : project.analysis.fitRanges.upsVbEdge;
      items.push(
        lineFitSeries(
          "VB edge",
          ups.vbEdge,
          project.analysis.fitRanges.upsVbEdge,
          "#1d4ed8",
          extent,
          "VBM edge",
        ),
      );
      items.push(
        lineFitSeries(
          "VB BG",
          ups.vbBackground,
          project.analysis.fitRanges.upsVbBackground,
          "#0f766e",
          extent,
          "VBM BG",
        ),
      );
    }
    return items;
  }, [project.analysis.fitRanges, ups, vbDataset]);

  const markers = useMemo<PlotMarker[]>(
    () =>
      ups
        ? [{ x: ups.vbEvbm, label: `VBM ${formatNumber(ups.vbEvbm, 2)} eV`, color: "#2563eb" }]
        : [],
    [ups],
  );
  const rangeBands = useMemo<PlotRangeBand[]>(
    () => [
      {
        id: "ups-vb-edge",
        ...project.analysis.fitRanges.upsVbEdge,
        label: "VBM edge",
        color: "#2563eb",
      },
      {
        id: "ups-vb-bg",
        ...project.analysis.fitRanges.upsVbBackground,
        label: "VBM BG",
        color: "#0f766e",
      },
    ],
    [activeFitTarget, project.analysis.fitRanges],
  );

  return (
    <SpectrumPlot
      title="UPS VB"
      xLabel="Binding Energy / eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      xDirection="reverse"
      viewportRequest={{
        id: `${project.id}-${project.analysis.selection.upsVbDatasetId ?? "none"}-${persistedViewportKey}`,
        viewport: persistedViewport,
      }}
      onViewportChange={setUpsVbPlotViewport}
      cursorStyle={project.ui?.cursorStyles?.upsVb ?? "point"}
      onCursorStyleChange={(style) => setPlotCursorStyle("upsVb", style)}
      onSelectRange={(range) => setFitRange(vbTarget(activeFitTarget), range)}
      onRangeBandChange={(target, range) => setFitRange(target as FitTarget, range)}
    />
  );
}
