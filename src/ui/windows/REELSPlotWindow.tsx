import { useMemo } from "react";
import { convertKineticToLoss } from "../../domain/analysis";
import type { FitTarget } from "../../domain/types";
import { useProjectStore } from "../../store/projectStore";
import { formatNumber } from "../format";
import {
  datasetSeries,
  lineFitSeries,
  type PlotAnnotation,
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
  const setReelsPlotViewport = useProjectStore((state) => state.setReelsPlotViewport);
  const setReelsBackgroundMode = useProjectStore((state) => state.setReelsBackgroundMode);
  const setPlotCursorStyle = useProjectStore((state) => state.setPlotCursorStyle);
  const reelsDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.reelsDatasetId,
  );
  const reels = project.analysis.reels;
  const persistedViewport = project.ui?.reelsPlotViewport ?? {};
  const persistedViewportKey = JSON.stringify(persistedViewport);
  const reelsBackgroundMode = project.ui?.reelsBackgroundMode ?? "fit-range";
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
      );
      if (reelsBackgroundMode !== "single-point") {
        items.push(
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
    }
    return items;
  }, [lossDataset, project.analysis.fitRanges, reels, reelsBackgroundMode]);

  const displayBandGap = useMemo(() => {
    if (!reels) {
      return undefined;
    }
    if (reelsBackgroundMode !== "single-point" || !lossDataset) {
      return reels.bandGap;
    }
    const x = rangeCenter(project.analysis.fitRanges.reelsBackground);
    const y = interpolateY(lossDataset.points, x);
    if (Math.abs(reels.edgeFit.slope) < 1e-12) {
      return reels.bandGap;
    }
    return (y - reels.edgeFit.intercept) / reels.edgeFit.slope;
  }, [lossDataset, project.analysis.fitRanges.reelsBackground, reels, reelsBackgroundMode]);

  const markers = useMemo<PlotMarker[]>(
    () =>
      displayBandGap !== undefined
        ? [
            {
              x: 0,
              label: "0 eV",
              color: "#111827",
            },
            {
              x: displayBandGap,
              label: "",
              color: "#111827",
            },
          ]
        : [],
    [displayBandGap],
  );

  const annotations = useMemo<PlotAnnotation[]>(
    () =>
      displayBandGap !== undefined
        ? [
            {
              type: "x-arrow",
              label: (
                <>
                  E
                  <tspan baselineShift="sub" fontSize={9}>
                    g
                  </tspan>
                  ={formatNumber(displayBandGap, 2)} eV
                </>
              ),
              color: "#111827",
              x1: 0,
              x2: displayBandGap,
              yFraction: 0.32,
              fontSize: 14,
              strokeWidth: 1.3,
            },
          ]
        : [],
    [displayBandGap],
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
        singlePointMode: reelsBackgroundMode === "single-point" ? "horizontal" : undefined,
      },
    ],
    [
      activeFitTarget,
      project.analysis.fitRanges.reelsBackground,
      project.analysis.fitRanges.reelsEdge,
      reelsBackgroundMode,
    ],
  );

  const contextItems = useMemo(
    () => [
      {
        type: "submenu" as const,
        label: "REELS BG mode",
        items: [
          {
            type: "item" as const,
            label: `${reelsBackgroundMode === "fit-range" ? "✓ " : ""}Fit range`,
            action: () => setReelsBackgroundMode("fit-range"),
          },
          {
            type: "item" as const,
            label: `${reelsBackgroundMode === "single-point" ? "✓ " : ""}Single point y=const`,
            action: () => setReelsBackgroundMode("single-point"),
          },
        ],
      },
    ],
    [reelsBackgroundMode, setReelsBackgroundMode],
  );

  return (
    <SpectrumPlot
      title="REELS"
      xLabel="Electron loss energy / eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      annotations={annotations}
      xDirection="reverse"
      viewportRequest={{
        id: `${project.id}-${project.analysis.selection.reelsDatasetId ?? "none"}-${persistedViewportKey}`,
        viewport: persistedViewport,
      }}
      extraContextMenuItems={contextItems}
      onViewportChange={setReelsPlotViewport}
      cursorStyle={project.ui?.cursorStyles?.reels ?? "point"}
      onCursorStyleChange={(style) => setPlotCursorStyle("reels", style)}
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

function rangeCenter(range: { min: number; max: number }): number {
  return (range.min + range.max) / 2;
}

function interpolateY(points: readonly { x: number; y: number }[], x: number): number {
  if (points.length === 0) {
    return 0;
  }
  const sorted = [...points].sort((left, right) => left.x - right.x);
  if (x <= sorted[0].x) {
    return sorted[0].y;
  }
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (x <= current.x) {
      const span = current.x - previous.x || 1;
      const ratio = (x - previous.x) / span;
      return previous.y + (current.y - previous.y) * ratio;
    }
  }
  return sorted[sorted.length - 1].y;
}
