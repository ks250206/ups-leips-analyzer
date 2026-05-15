import { useMemo } from "react";
import { convertKineticToLoss } from "../../domain/analysis";
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

export function REELSPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const reelsDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.reelsDatasetId,
  );
  const reels = project.analysis.reels;
  const lossDataset = useMemo(
    () =>
      reelsDataset
        ? {
            ...reelsDataset,
            name: `${reelsDataset.name} loss`,
            xLabel: "Electron loss energy / eV",
            points: convertKineticToLoss(reelsDataset.points, project.analysis.reelsIncidentEnergy),
          }
        : undefined,
    [project.analysis.reelsIncidentEnergy, reelsDataset],
  );

  const series = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [];
    if (lossDataset) {
      items.push(datasetSeries(lossDataset, "#111827"));
    }
    if (reels) {
      const extent = lossDataset
        ? xExtent(lossDataset.points)
        : project.analysis.fitRanges.reelsEdge;
      items.push(
        lineFitSeries(
          "REELS onset edge",
          reels.edgeFit,
          project.analysis.fitRanges.reelsEdge,
          "#dc2626",
          extent,
          "onset edge",
        ),
        lineFitSeries(
          "REELS BG",
          reels.backgroundFit,
          project.analysis.fitRanges.reelsBackground,
          "#0f766e",
          extent,
          "BG",
        ),
      );
    }
    return items;
  }, [lossDataset, project.analysis.fitRanges, reels]);

  const markers = useMemo<PlotMarker[]>(
    () =>
      reels
        ? [
            {
              x: reels.bandGap,
              label: `Eg ${formatNumber(reels.bandGap, 2)} eV`,
              color: "#111827",
            },
          ]
        : [],
    [reels],
  );

  const rangeBands = useMemo<PlotRangeBand[]>(
    () => [
      {
        id: "reels-edge",
        ...project.analysis.fitRanges.reelsEdge,
        label: "onset edge",
        color: "#dc2626",
      },
      {
        id: "reels-bg",
        ...project.analysis.fitRanges.reelsBackground,
        label: "BG",
        color: "#0f766e",
      },
    ],
    [
      activeFitTarget,
      project.analysis.fitRanges.reelsBackground,
      project.analysis.fitRanges.reelsEdge,
    ],
  );

  return (
    <SpectrumPlot
      title="REELS"
      xLabel="Electron loss energy / eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      xDirection="normal"
      onSelectRange={(range) => {
        if (activeFitTarget === "reels-bg" || activeFitTarget === "reels-edge") {
          setFitRange(activeFitTarget, range);
          return;
        }
        setFitRange("reels-edge", range);
      }}
      onRangeBandChange={(target, range) => setFitRange(target as FitTarget, range)}
    />
  );
}
