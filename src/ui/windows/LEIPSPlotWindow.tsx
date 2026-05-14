import { useMemo } from "react";
import type { FitTarget } from "../../domain/types";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import {
  datasetSeries,
  gaussianSeries,
  lineFitSeries,
  type PlotMarker,
  type PlotRangeBand,
  type PlotSeries,
  xExtent,
} from "../plotData";
import { SpectrumPlot } from "./SpectrumPlot";

export function LEIPSPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
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
      items.push(datasetSeries(leipsDataset, "#dc2626", "right"));
    }
    if (leips && leetDerDataset) {
      items.push(gaussianSeries("LEET(der) fit", leips.peakFit, leetDerDataset.points, "#0f172a"));
    }
    return items;
  }, [leetDataset, leetDerDataset, leips, leipsDataset]);

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
          ]
        : [],
    [leips],
  );

  const rangeBands = useMemo<PlotRangeBand[]>(
    () => [
      {
        id: "leet-der-peak",
        ...project.analysis.fitRanges.leetDerPeak,
        label: activeFitTarget === "leet-der-peak" ? "active peak" : "peak",
        color: "#2563eb",
        cursorLabels: ["A", "B"],
      },
    ],
    [activeFitTarget, project.analysis.fitRanges.leetDerPeak],
  );

  return (
    <SpectrumPlot
      title="LEET / LEET(der) / LEIPS"
      xLabel="Applied Bias Vbias / V"
      yLabel="Intensity / a.u."
      yRightLabel="LEIPS Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      xDirection="reverse"
      onSelectRange={(range) => setFitRange("leet-der-peak", range)}
      onRangeBandChange={(target, range) => setFitRange(target as FitTarget, range)}
    />
  );
}

export function LEIPSEvacPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const leipsDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.leipsDatasetId,
  );
  const leips = project.analysis.leips;

  const series = useMemo<PlotSeries[]>(() => {
    if (!leips) {
      return [];
    }
    const extent = xExtent(leips.leipsEvacPoints);
    return [
      {
        name: leipsDataset ? `${leipsDataset.name} vs Evac` : "LEIPS vs Evac",
        color: "#dc2626",
        points: leips.leipsEvacPoints,
        width: 2,
      },
      lineFitSeries(
        "LEIPS edge",
        leips.leipsEdge,
        project.analysis.fitRanges.leipsEdge,
        "#b91c1c",
        extent,
      ),
      lineFitSeries(
        "LEIPS BG",
        leips.leipsBackground,
        project.analysis.fitRanges.leipsBackground,
        "#15803d",
        extent,
      ),
    ];
  }, [leips, leipsDataset, project.analysis.fitRanges]);

  const markers = useMemo<PlotMarker[]>(
    () =>
      leips ? [{ x: leips.ea, label: `EA ${formatNumber(leips.ea, 2)} eV`, color: "#dc2626" }] : [],
    [leips],
  );

  const rangeBands = useMemo<PlotRangeBand[]>(
    () => [
      {
        id: "leips-edge",
        ...project.analysis.fitRanges.leipsEdge,
        label: activeFitTarget === "leips-edge" ? "active edge" : "edge",
        color: "#dc2626",
        cursorLabels: ["A", "B"],
      },
      {
        id: "leips-bg",
        ...project.analysis.fitRanges.leipsBackground,
        label: activeFitTarget === "leips-bg" ? "active BG" : "BG",
        color: "#15803d",
        cursorLabels: ["C", "D"],
      },
    ],
    [
      activeFitTarget,
      project.analysis.fitRanges.leipsBackground,
      project.analysis.fitRanges.leipsEdge,
    ],
  );

  return (
    <SpectrumPlot
      title="LEIPS vs Energy from Evac."
      xLabel="Energy from Evac. / eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      xDirection="reverse"
      onSelectRange={(range) => {
        if (activeFitTarget === "leips-bg" || activeFitTarget === "leips-edge") {
          setFitRange(activeFitTarget, range);
          return;
        }
        setFitRange("leips-edge", range);
      }}
      onRangeBandChange={(target, range) => setFitRange(target as FitTarget, range)}
    />
  );
}
