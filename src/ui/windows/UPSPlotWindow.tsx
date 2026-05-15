import { useMemo, useState } from "react";
import type { FitRange, FitTarget } from "../../domain/types";
import { useProjectStore } from "../../store/projectStore";
import type { ContextMenuItem } from "../ContextMenu";
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
import type { PlotViewport } from "./SpectrumPlot";

export function UPSVBPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const vbDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.upsVbDatasetId,
  );
  const ups = project.analysis.ups;

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
        ),
      );
      items.push(
        lineFitSeries(
          "VB BG",
          ups.vbBackground,
          project.analysis.fitRanges.upsVbBackground,
          "#0f766e",
          extent,
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
        label: activeFitTarget === "ups-vb-edge" ? "active VBM edge" : "VBM edge",
        color: "#2563eb",
        cursorLabels: ["A", "B"],
      },
      {
        id: "ups-vb-bg",
        ...project.analysis.fitRanges.upsVbBackground,
        label: activeFitTarget === "ups-vb-bg" ? "active VBM BG" : "VBM BG",
        color: "#0f766e",
        cursorLabels: ["C", "D"],
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
      onSelectRange={(range) => setFitRange(vbTarget(activeFitTarget), range)}
      onRangeBandChange={(target, range) => setFitRange(target as FitTarget, range)}
    />
  );
}

export function UPSIPPlotWindow() {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const [viewport, setViewport] = useState<PlotViewport>({});
  const [viewportRequest, setViewportRequest] = useState<
    { id: number; viewport: PlotViewport } | undefined
  >();
  const [snapshots, setSnapshots] = useState<{
    evbm?: PlotViewport;
    cutoff?: PlotViewport;
  }>({});
  const ipDataset = project.datasets.find(
    (dataset) => dataset.id === project.analysis.selection.upsIpDatasetId,
  );
  const ups = project.analysis.ups;

  const series = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [];
    if (ipDataset) {
      items.push(datasetSeries(ipDataset, "#dc2626"));
    }
    if (ups) {
      const extent = ipDataset ? xExtent(ipDataset.points) : project.analysis.fitRanges.upsIpEdge;
      items.push(
        lineFitSeries(
          "IP VBM edge",
          ups.ipVbmEdge,
          project.analysis.fitRanges.upsIpVbmEdge,
          "#7c3aed",
          extent,
        ),
      );
      items.push(
        lineFitSeries(
          "IP VBM BG",
          ups.ipVbmBackground,
          project.analysis.fitRanges.upsIpVbmBackground,
          "#0f766e",
          extent,
        ),
      );
      items.push(
        lineFitSeries(
          "Cut-off edge",
          ups.cutoffEdge,
          project.analysis.fitRanges.upsIpEdge,
          "#b91c1c",
          extent,
        ),
      );
      items.push(
        lineFitSeries(
          "Cut-off BG",
          ups.cutoffBackground,
          project.analysis.fitRanges.upsIpBackground,
          "#15803d",
          extent,
        ),
      );
    }
    return items;
  }, [ipDataset, project.analysis.fitRanges, ups]);

  const markers = useMemo<PlotMarker[]>(
    () =>
      ups
        ? [
            {
              x: ups.ipEvbm,
              label: `EVBM ${formatNumber(ups.ipEvbm, 2)} eV`,
              color: "#7c3aed",
            },
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
        id: "ups-ip-vbm-edge",
        ...project.analysis.fitRanges.upsIpVbmEdge,
        label: activeFitTarget === "ups-ip-vbm-edge" ? "active VBM edge" : "VBM edge",
        color: "#7c3aed",
        cursorLabels: ["A", "B"],
      },
      {
        id: "ups-ip-vbm-bg",
        ...project.analysis.fitRanges.upsIpVbmBackground,
        label: activeFitTarget === "ups-ip-vbm-bg" ? "active VBM BG" : "VBM BG",
        color: "#0f766e",
        cursorLabels: ["C", "D"],
      },
      {
        id: "ups-ip-edge",
        ...project.analysis.fitRanges.upsIpEdge,
        label: activeFitTarget === "ups-ip-edge" ? "active cut-off edge" : "cut-off edge",
        color: "#dc2626",
        cursorLabels: ["E", "F"],
      },
      {
        id: "ups-ip-bg",
        ...project.analysis.fitRanges.upsIpBackground,
        label: activeFitTarget === "ups-ip-bg" ? "active cut-off BG" : "cut-off BG",
        color: "#15803d",
        cursorLabels: ["G", "H"],
      },
    ],
    [activeFitTarget, project.analysis.fitRanges],
  );
  const evbmFallbackViewport = useMemo(
    () =>
      viewportAroundRanges([
        project.analysis.fitRanges.upsIpVbmEdge,
        project.analysis.fitRanges.upsIpVbmBackground,
      ]),
    [project.analysis.fitRanges.upsIpVbmBackground, project.analysis.fitRanges.upsIpVbmEdge],
  );
  const cutoffFallbackViewport = useMemo(
    () =>
      viewportAroundRanges([
        project.analysis.fitRanges.upsIpEdge,
        project.analysis.fitRanges.upsIpBackground,
      ]),
    [project.analysis.fitRanges.upsIpBackground, project.analysis.fitRanges.upsIpEdge],
  );
  const contextItems = useMemo<ContextMenuItem[]>(
    () => [
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
    [cutoffFallbackViewport, evbmFallbackViewport, snapshots.cutoff, snapshots.evbm, viewport],
  );

  return (
    <SpectrumPlot
      title="UPS IP"
      xLabel="Binding Energy / eV"
      yLabel="Intensity / a.u."
      series={series}
      markers={markers}
      rangeBands={rangeBands}
      xDirection="reverse"
      viewportRequest={viewportRequest}
      onViewportChange={setViewport}
      extraContextMenuItems={contextItems}
      onSelectRange={(range) => setFitRange(ipTarget(activeFitTarget), range)}
      onRangeBandChange={(target, range) => setFitRange(target as FitTarget, range)}
    />
  );
}

function viewportAroundRanges(ranges: readonly FitRange[]): PlotViewport {
  const min = Math.min(...ranges.map((range) => Math.min(range.min, range.max)));
  const max = Math.max(...ranges.map((range) => Math.max(range.min, range.max)));
  const padding = Math.max((max - min) * 0.3, 0.25);
  return { x: { min: min - padding, max: max + padding } };
}

function vbTarget(active: FitTarget): FitTarget {
  return active === "ups-vb-edge" || active === "ups-vb-bg" ? active : "ups-vb-edge";
}

function ipTarget(active: FitTarget): FitTarget {
  return active === "ups-ip-vbm-edge" ||
    active === "ups-ip-vbm-bg" ||
    active === "ups-ip-edge" ||
    active === "ups-ip-bg"
    ? active
    : "ups-ip-vbm-edge";
}
