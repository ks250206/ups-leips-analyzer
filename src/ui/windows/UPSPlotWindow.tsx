import { useMemo } from "react";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import {
  datasetSeries,
  lineFitSeries,
  type PlotMarker,
  type PlotRangeBand,
  type PlotSeries,
} from "../plotData";
import { SpectrumPlot } from "./SpectrumPlot";

export function UPSPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const vbDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.upsVbDatasetId,
  );
  const ipDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.upsIpDatasetId,
  );
  const ups = project.analysis.ups;

  const series = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [];
    if (vbDataset) {
      items.push(datasetSeries(vbDataset, "#2563eb"));
    }
    if (ipDataset) {
      items.push(datasetSeries(ipDataset, "#dc2626"));
    }
    if (ups) {
      items.push(
        lineFitSeries("VB edge", ups.vbEdge, project.analysis.fitRanges.upsVbEdge, "#1d4ed8"),
      );
      items.push(
        lineFitSeries(
          "VB BG",
          ups.vbBackground,
          project.analysis.fitRanges.upsVbBackground,
          "#0f766e",
        ),
      );
      items.push(
        lineFitSeries(
          "Cut-off edge",
          ups.cutoffEdge,
          project.analysis.fitRanges.upsIpEdge,
          "#b91c1c",
        ),
      );
      items.push(
        lineFitSeries(
          "Cut-off BG",
          ups.cutoffBackground,
          project.analysis.fitRanges.upsIpBackground,
          "#15803d",
        ),
      );
    }
    return items;
  }, [ipDataset, project.analysis.fitRanges, ups, vbDataset]);

  const markers = useMemo<PlotMarker[]>(
    () =>
      ups
        ? [
            { x: ups.vbm, label: `VBM ${formatNumber(ups.vbm, 2)} eV`, color: "#2563eb" },
            {
              x: ups.ecutoff,
              label: `Cut-off ${formatNumber(ups.ecutoff, 2)} eV`,
              color: "#dc2626",
            },
          ]
        : [],
    [ups],
  );
  const rangeBands = useMemo<PlotRangeBand[]>(
    () => [
      {
        ...project.analysis.fitRanges.upsVbEdge,
        label: activeFitTarget === "ups-vb-edge" ? "active VBM edge" : "VBM edge",
        color: "#2563eb",
      },
      {
        ...project.analysis.fitRanges.upsVbBackground,
        label: activeFitTarget === "ups-vb-bg" ? "active VBM BG" : "VBM BG",
        color: "#0f766e",
      },
      {
        ...project.analysis.fitRanges.upsIpEdge,
        label: activeFitTarget === "ups-ip-edge" ? "active cut-off edge" : "cut-off edge",
        color: "#dc2626",
      },
      {
        ...project.analysis.fitRanges.upsIpBackground,
        label: activeFitTarget === "ups-ip-bg" ? "active cut-off BG" : "cut-off BG",
        color: "#15803d",
      },
    ],
    [activeFitTarget, project.analysis.fitRanges],
  );

  return (
    <SpectrumPlot
      title="UPS"
      xLabel="Binding Energy / eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      onSelectRange={(range) => setFitRange(activeFitTarget, range)}
    />
  );
}
