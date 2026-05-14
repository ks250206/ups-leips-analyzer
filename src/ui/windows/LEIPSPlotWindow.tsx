import { useMemo } from "react";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import {
  datasetSeries,
  gaussianSeries,
  lineFitSeries,
  type PlotMarker,
  type PlotSeries,
} from "../plotData";
import { SpectrumPlot } from "./SpectrumPlot";

export function LEIPSPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const leetDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.leetDatasetId,
  );
  const leetDerDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.leetDerDatasetId,
  );
  const leipsDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.leipsDatasetId,
  );
  const leips = project.analysis.leips;

  const series = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [];
    if (leetDataset) {
      items.push(datasetSeries(leetDataset, "#16a34a"));
    }
    if (leetDerDataset) {
      items.push(datasetSeries(leetDerDataset, "#2563eb"));
    }
    if (leipsDataset) {
      items.push(datasetSeries(leipsDataset, "#dc2626"));
    }
    if (leips && leetDerDataset) {
      items.push(gaussianSeries("LEET(der) fit", leips.peakFit, leetDerDataset.points, "#0f172a"));
      items.push(
        lineFitSeries(
          "LEIPS edge",
          leips.leipsEdge,
          project.analysis.fitRanges.leipsEdge,
          "#b91c1c",
        ),
      );
      items.push(
        lineFitSeries(
          "LEIPS BG",
          leips.leipsBackground,
          project.analysis.fitRanges.leipsBackground,
          "#15803d",
        ),
      );
    }
    return items;
  }, [leetDataset, leetDerDataset, leips, leipsDataset, project.analysis.fitRanges]);

  const markers = useMemo<PlotMarker[]>(
    () =>
      leips
        ? [
            { x: leips.ePeak, label: `Epeak ${formatNumber(leips.ePeak, 2)} V`, color: "#2563eb" },
            {
              x: leips.vacuumLevel,
              label: `Evac ${formatNumber(leips.vacuumLevel, 2)} eV`,
              color: "#0f766e",
            },
            { x: leips.ea, label: `EA ${formatNumber(leips.ea, 2)} eV`, color: "#dc2626" },
          ]
        : [],
    [leips],
  );

  return (
    <SpectrumPlot
      title="LEET / LEET(der) / LEIPS"
      xLabel="Applied Bias Vbias / V"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      onSelectRange={(range) => setFitRange(activeFitTarget, range)}
    />
  );
}
