import { useEffect, useMemo, useState } from "react";
import type { FitTarget } from "../../domain/types";
import { useProjectStore } from "../../store/projectStore";
import type { ContextMenuItem } from "../ContextMenu";
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
import { SpectrumPlot, type PlotViewport } from "./SpectrumPlot";
import { defaultIpRanges, ipTarget, viewportAroundRanges } from "./UPSPlotModel";

export function UPSIPPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const setUpsIpFitRange = useProjectStore((state) => state.setUpsIpFitRange);
  const setUpsIpPlotViewportForDataset = useProjectStore(
    (state) => state.setUpsIpPlotViewportForDataset,
  );
  const setActiveUpsIpDatasetId = useProjectStore((state) => state.setActiveUpsIpDatasetId);
  const setPlotCursorStyle = useProjectStore((state) => state.setPlotCursorStyle);
  const [viewport, setViewport] = useState<PlotViewport>({});
  const [viewportRequest, setViewportRequest] = useState<
    { id: number; viewport: PlotViewport } | undefined
  >();
  const [snapshots, setSnapshots] = useState<{
    evbm?: PlotViewport;
    cutoff?: PlotViewport;
  }>({});
  const ipDatasetIds = project.analysis.selection.upsIpDatasetIds ?? [];
  const activeId =
    project.ui?.activeUpsIpDatasetId && ipDatasetIds.includes(project.ui.activeUpsIpDatasetId)
      ? project.ui.activeUpsIpDatasetId
      : ipDatasetIds[0];
  const ipDataset = project.datasets.find((dataset) => dataset.id === activeId);
  const ups = project.analysis.ups;
  const ipResult = ups?.ipResults.find((result) => result.datasetId === activeId);
  const fitRanges = activeId
    ? (project.analysis.upsIpFitRangesByDatasetId?.[activeId] ?? defaultIpRanges())
    : defaultIpRanges();
  const persistedViewport = activeId
    ? (project.ui?.upsIpPlotViewportsByDatasetId?.[activeId] ?? project.ui?.upsIpPlotViewport ?? {})
    : {};
  const persistedViewportKey = JSON.stringify(persistedViewport);
  useEffect(() => {
    setViewportRequest(undefined);
  }, [activeId]);

  const series = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [];
    if (ipDataset) {
      items.push(datasetSeries(ipDataset, "#dc2626"));
    }
    if (ipResult) {
      const extent = ipDataset ? xExtent(ipDataset.points) : fitRanges.cutoffEdge;
      items.push(
        lineFitSeries(
          "IP VBM edge",
          ipResult.ipVbmEdge,
          fitRanges.ipVbmEdge,
          "#7c3aed",
          extent,
          "VBM edge",
        ),
      );
      items.push(
        lineFitSeries(
          "IP VBM BG",
          ipResult.ipVbmBackground,
          fitRanges.ipVbmBackground,
          "#0f766e",
          extent,
          "VBM BG",
        ),
      );
      items.push(
        lineFitSeries(
          "Cut-off edge",
          ipResult.cutoffEdge,
          fitRanges.cutoffEdge,
          "#f97316",
          extent,
          "cut-off edge",
        ),
      );
      items.push(
        lineFitSeries(
          "Cut-off BG",
          ipResult.cutoffBackground,
          fitRanges.cutoffBackground,
          "#15803d",
          extent,
          "cut-off BG",
        ),
      );
    }
    return items;
  }, [fitRanges, ipDataset, ipResult]);

  const markers = useMemo<PlotMarker[]>(
    () =>
      ipResult
        ? [
            {
              x: ipResult.ipEvbm,
              label: `VBM ${formatNumber(ipResult.ipEvbm, 2)} eV`,
              color: "#7c3aed",
            },
            {
              x: ipResult.ecutoff,
              label: `Cut-off ${formatNumber(ipResult.ecutoff, 2)} eV`,
              color: "#dc2626",
            },
          ]
        : [],
    [ipResult],
  );
  const annotations = useMemo<PlotAnnotation[]>(
    () =>
      ipResult
        ? [
            {
              type: "text",
              label: `IP=${formatNumber(ipResult.ip, 2)} eV`,
              color: "#dc2626",
              xFraction: 0.98,
              yFraction: 0.12,
              fontSize: 14,
              anchor: "end",
            },
          ]
        : [],
    [ipResult],
  );
  const rangeBands = useMemo<PlotRangeBand[]>(
    () => [
      {
        id: "ups-ip-vbm-edge",
        ...fitRanges.ipVbmEdge,
        label: "VBM edge",
        color: "#7c3aed",
      },
      {
        id: "ups-ip-vbm-bg",
        ...fitRanges.ipVbmBackground,
        label: "VBM BG",
        color: "#0f766e",
      },
      {
        id: "ups-ip-edge",
        ...fitRanges.cutoffEdge,
        label: "cut-off edge",
        color: "#f97316",
      },
      {
        id: "ups-ip-bg",
        ...fitRanges.cutoffBackground,
        label: "cut-off BG",
        color: "#15803d",
      },
    ],
    [activeFitTarget, fitRanges],
  );
  const evbmFallbackViewport = useMemo(
    () => viewportAroundRanges([fitRanges.ipVbmEdge, fitRanges.ipVbmBackground]),
    [fitRanges.ipVbmBackground, fitRanges.ipVbmEdge],
  );
  const cutoffFallbackViewport = useMemo(
    () => viewportAroundRanges([fitRanges.cutoffEdge, fitRanges.cutoffBackground]),
    [fitRanges.cutoffBackground, fitRanges.cutoffEdge],
  );
  const contextItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        type: "submenu",
        label: "Active UPS IP dataset",
        items:
          ipDatasetIds.length > 0
            ? ipDatasetIds.map((datasetId) => {
                const dataset = project.datasets.find((item) => item.id === datasetId);
                return {
                  type: "item" as const,
                  label: `${datasetId === activeId ? "✓ " : ""}${dataset?.name ?? datasetId}`,
                  action: () => setActiveUpsIpDatasetId(datasetId),
                };
              })
            : [{ type: "item", label: "No selected UPS IP datasets", disabled: true }],
      },
      { type: "separator" },
      {
        type: "item",
        label: "Save VBM view",
        action: () => setSnapshots((current) => ({ ...current, evbm: viewport })),
      },
      {
        type: "item",
        label: "Recall VBM view",
        action: () =>
          setViewportRequest({
            id: Date.now(),
            viewport: snapshots.evbm ?? evbmFallbackViewport,
          }),
      },
      { type: "separator" },
      {
        type: "item",
        label: "Save Cut-off view",
        action: () => setSnapshots((current) => ({ ...current, cutoff: viewport })),
      },
      {
        type: "item",
        label: "Recall Cut-off view",
        action: () =>
          setViewportRequest({
            id: Date.now(),
            viewport: snapshots.cutoff ?? cutoffFallbackViewport,
          }),
      },
    ],
    [
      activeId,
      cutoffFallbackViewport,
      evbmFallbackViewport,
      ipDatasetIds,
      project.datasets,
      setActiveUpsIpDatasetId,
      snapshots.cutoff,
      snapshots.evbm,
      viewport,
    ],
  );

  return (
    <SpectrumPlot
      title="UPS IP"
      xLabel="Binding Energy / eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      annotations={annotations}
      xDirection="reverse"
      viewportRequest={
        viewportRequest ?? {
          id: `${project.id}-${activeId ?? "none"}-${persistedViewportKey}`,
          viewport: persistedViewport,
        }
      }
      onViewportChange={(next) => {
        setViewport(next);
        if (activeId) {
          setUpsIpPlotViewportForDataset(activeId, next);
        }
      }}
      cursorStyle={project.ui?.cursorStyles?.upsIp ?? "point"}
      onCursorStyleChange={(style) => setPlotCursorStyle("upsIp", style)}
      extraContextMenuItems={contextItems}
      onSelectRange={(range) => {
        if (activeId) {
          setUpsIpFitRange(activeId, ipTarget(activeFitTarget), range);
        }
      }}
      onRangeBandChange={(target, range) => {
        if (activeId) {
          setUpsIpFitRange(activeId, target as FitTarget, range);
        }
      }}
    />
  );
}
