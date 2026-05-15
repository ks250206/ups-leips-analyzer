import { useMemo } from "react";
import { convertBiasToVacuumEnergy } from "../../domain/analysis";
import { BANDPASS_OPTIONS, CUSTOM_BANDPASS_TYPE } from "../../domain/constants";
import type { FitTarget, Point, SpectrumDataset } from "../../domain/types";
import { resolvedBandpassEnergy, useProjectStore } from "../../store/projectStore";
import type { ContextMenuItem } from "../ContextMenu";
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
  const setBandpassType = useProjectStore((state) => state.setBandpassType);
  const setCustomBandpassEnergy = useProjectStore((state) => state.setCustomBandpassEnergy);
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
        label: "peak",
        color: "#2563eb",
      },
    ],
    [activeFitTarget, project.analysis.fitRanges.leetDerPeak],
  );
  const contextItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        type: "submenu",
        label: "Filter",
        items: [
          ...BANDPASS_OPTIONS.map((option) => ({
            type: "item" as const,
            label:
              option.type === project.analysis.bandpassType
                ? `Band pass ${option.label} ✓`
                : `Band pass ${option.label}`,
            action: () => setBandpassType(option.type),
          })),
          {
            type: "item",
            label:
              project.analysis.bandpassType === CUSTOM_BANDPASS_TYPE
                ? `Custom ${formatNumber(project.analysis.customBandpassEnergy, 2)} eV ✓`
                : "Custom band pass",
            action: () =>
              setCustomBandpassEnergy(
                project.analysis.customBandpassEnergy ??
                  project.analysis.leips?.bandpassEnergy ??
                  resolvedBandpassEnergy(project.analysis),
              ),
          },
        ],
      },
    ],
    [project.analysis, setBandpassType, setCustomBandpassEnergy],
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
      marginVariant="leips"
      xDirection="normal"
      extraContextMenuItems={contextItems}
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
  const leetDerDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.leetDerDatasetId,
  );
  const leips = project.analysis.leips;
  const leipsEvacPoints = useMemo(
    () =>
      leips?.leipsEvacPoints ??
      estimateLeipsEvacPoints(
        leetDerDataset,
        leipsDataset,
        project.analysis.fitRanges.leetDerPeak,
        resolvedBandpassEnergy(project.analysis),
      ),
    [leetDerDataset, leips, leipsDataset, project.analysis, project.analysis.fitRanges.leetDerPeak],
  );

  const series = useMemo<PlotSeries[]>(() => {
    if (leipsEvacPoints.length === 0) {
      return [];
    }
    const extent = xExtent(leipsEvacPoints);
    const items: PlotSeries[] = [
      {
        name: leipsDataset ? `${leipsDataset.name} vs Evac` : "LEIPS vs Evac",
        color: "#dc2626",
        points: leipsEvacPoints,
        width: 2,
      },
    ];
    if (leips) {
      items.push(
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
      );
    }
    return items;
  }, [leips, leipsDataset, leipsEvacPoints, project.analysis.fitRanges]);

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
        label: "edge",
        color: "#dc2626",
      },
      {
        id: "leips-bg",
        ...project.analysis.fitRanges.leipsBackground,
        label: "BG",
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
    <SpectrumPlot
      title="LEIPS vs Energy from Evac."
      xLabel="Energy from Evac. / eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      marginVariant="leips"
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

function estimateLeipsEvacPoints(
  leetDerDataset: SpectrumDataset | undefined,
  leipsDataset: SpectrumDataset | undefined,
  peakRange: { min: number; max: number },
  bandpass: number,
): Point[] {
  if (!leetDerDataset || !leipsDataset) {
    return [];
  }
  const selected = leetDerDataset.points.filter(
    (point) => point.x >= peakRange.min && point.x <= peakRange.max,
  );
  const peakCandidates = selected.length > 0 ? selected : leetDerDataset.points;
  const peakPoint = peakCandidates.reduce<Point | undefined>(
    (currentMax, point) => (!currentMax || point.y > currentMax.y ? point : currentMax),
    undefined,
  );
  if (!peakPoint) {
    return [];
  }
  return convertBiasToVacuumEnergy(leipsDataset.points, peakPoint.x + bandpass);
}
