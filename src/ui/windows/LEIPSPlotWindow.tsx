import { useMemo } from "react";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import {
  datasetSeries,
  gaussianSeries,
  lineFitSeries,
  type PlotMarker,
  type PlotRangeBand,
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

  const biasSeries = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [];
    if (leetDataset) {
      items.push(datasetSeries(leetDataset, "#16a34a"));
    }
    if (leetDerDataset) {
      items.push(datasetSeries(leetDerDataset, "#2563eb"));
    }
    if (leips && leetDerDataset) {
      items.push(gaussianSeries("LEET(der) fit", leips.peakFit, leetDerDataset.points, "#0f172a"));
    }
    return items;
  }, [leetDataset, leetDerDataset, leips]);

  const evacSeries = useMemo<PlotSeries[]>(() => {
    if (!leips) {
      return [];
    }
    return [
      {
        name: leipsDataset ? `${leipsDataset.name} vs Evac` : "LEIPS vs Evac",
        color: "#dc2626",
        points: leips.leipsEvacPoints,
        width: 2,
      },
      lineFitSeries("LEIPS edge", leips.leipsEdge, project.analysis.fitRanges.leipsEdge, "#b91c1c"),
      lineFitSeries(
        "LEIPS BG",
        leips.leipsBackground,
        project.analysis.fitRanges.leipsBackground,
        "#15803d",
      ),
    ];
  }, [leips, leipsDataset, project.analysis.fitRanges]);

  const biasMarkers = useMemo<PlotMarker[]>(
    () =>
      leips
        ? [
            { x: leips.ePeak, label: `Epeak ${formatNumber(leips.ePeak, 2)} V`, color: "#2563eb" },
            {
              x: leips.vacuumLevel,
              label: `Evac ${formatNumber(leips.vacuumLevel, 2)} eV`,
              color: "#0f766e",
            },
          ]
        : [],
    [leips],
  );

  const evacMarkers = useMemo<PlotMarker[]>(
    () =>
      leips ? [{ x: leips.ea, label: `EA ${formatNumber(leips.ea, 2)} eV`, color: "#dc2626" }] : [],
    [leips],
  );

  const biasBands = useMemo<PlotRangeBand[]>(
    () => [
      {
        ...project.analysis.fitRanges.leetDerPeak,
        label: activeFitTarget === "leet-der-peak" ? "active peak" : "peak",
        color: "#2563eb",
      },
    ],
    [activeFitTarget, project.analysis.fitRanges.leetDerPeak],
  );

  const evacBands = useMemo<PlotRangeBand[]>(
    () => [
      {
        ...project.analysis.fitRanges.leipsEdge,
        label: activeFitTarget === "leips-edge" ? "active edge" : "edge",
        color: "#dc2626",
      },
      {
        ...project.analysis.fitRanges.leipsBackground,
        label: activeFitTarget === "leips-bg" ? "active BG" : "BG",
        color: "#15803d",
      },
    ],
    [
      activeFitTarget,
      project.analysis.fitRanges.leipsBackground,
      project.analysis.fitRanges.leipsEdge,
    ],
  );

  return (
    <div className="grid h-full grid-rows-2 gap-px bg-slate-300">
      <SpectrumPlot
        title="LEET / LEET(der)"
        xLabel="Applied Bias Vbias / V"
        yLabel="Intensity / a.u."
        series={biasSeries}
        markers={biasMarkers}
        rangeBands={biasBands}
        onSelectRange={(range) => setFitRange("leet-der-peak", range)}
      />
      <SpectrumPlot
        title="LEIPS vs Evac"
        xLabel="Energy from Evac / eV"
        yLabel="Intensity / a.u."
        series={evacSeries}
        markers={evacMarkers}
        rangeBands={evacBands}
        onSelectRange={(range) => {
          if (activeFitTarget === "leips-bg" || activeFitTarget === "leips-edge") {
            setFitRange(activeFitTarget, range);
            return;
          }
          setFitRange("leips-edge", range);
        }}
      />
    </div>
  );
}
