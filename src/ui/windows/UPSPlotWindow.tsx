import { useEffect, useMemo, useState } from "react";
import { calculateBiasDependence } from "../../domain/analysis";
import type { FitRange, FitTarget, UPSIPResult } from "../../domain/types";
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
import { SpectrumPlot } from "./SpectrumPlot";
import type { PlotViewport } from "./SpectrumPlot";

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

export function UPSBiasDependenceWindow() {
  const project = useProjectStore((state) => state.project);
  const setUpsBiasPlotViewport = useProjectStore((state) => state.setUpsBiasPlotViewport);
  const ipResults = project.analysis.ups?.ipResults ?? [];
  const viewports = project.ui?.upsBiasPlotViewports ?? {};
  return (
    <div className="grid h-full grid-cols-3 gap-3 bg-white p-3">
      {BIAS_PLOTS.map((config) => (
        <BiasDependencePlot
          key={config.id}
          config={config}
          ipResults={ipResults}
          viewport={viewports[config.id] ?? {}}
          onViewportChange={(viewport) => setUpsBiasPlotViewport(config.id, viewport)}
        />
      ))}
    </div>
  );
}

const BIAS_PLOTS = [
  {
    id: "ecutoff",
    label: "Binding energy of Ecut-off / eV",
    field: "ecutoff",
    color: "#ef4444",
  },
  {
    id: "evbm",
    label: "Binding energy of EVBM / eV",
    field: "ipEvbm",
    color: "#f97316",
  },
  {
    id: "ip",
    label: "Ionization potential (IP) / eV",
    field: "ip",
    color: "#dc2626",
  },
] as const;

function BiasDependencePlot({
  config,
  ipResults,
  viewport,
  onViewportChange,
}: {
  config: (typeof BIAS_PLOTS)[number];
  ipResults: readonly UPSIPResult[];
  viewport: PlotViewport;
  onViewportChange: (viewport: PlotViewport) => void;
}) {
  const points = ipResults.map((result) => ({
    x: result.appliedVoltage,
    y: result[config.field],
  }));
  const dependence = calculateBiasDependence(
    points.map((point) => ({ voltage: point.x, value: point.y })),
  );
  const series = useMemo<PlotSeries[]>(() => {
    const items: PlotSeries[] = [
      {
        name: config.label,
        color: config.color,
        points,
        width: 0,
        pointRadius: 3.5,
      },
    ];
    if (dependence && points.length >= 2) {
      const min = Math.min(...points.map((point) => point.x));
      const max = Math.max(...points.map((point) => point.x));
      items.push({
        name: "linear fit",
        color: config.color,
        points: [
          { x: min, y: dependence.slope * min + dependence.intercept },
          { x: max, y: dependence.slope * max + dependence.intercept },
        ],
        dash: [5, 3],
        width: 1.5,
        affectsScale: false,
        fitLabel: `y = ${formatNumber(dependence.slope, 3)}x + ${formatNumber(
          dependence.intercept,
          3,
        )} eV`,
      });
    }
    return items;
  }, [config.color, config.label, dependence, points]);
  const viewportKey = JSON.stringify(viewport);
  return (
    <div className="min-w-0">
      <div className="aspect-[4/3] w-full">
        <SpectrumPlot
          title={`UPS Bias Dependence ${config.id}`}
          xLabel="Applied Bias Vbias / V"
          yLabel={config.label}
          series={series}
          marginVariant="bias"
          xLabelBottomPadding={10}
          viewportRequest={{ id: `${config.id}-${viewportKey}`, viewport }}
          onViewportChange={onViewportChange}
        />
      </div>
    </div>
  );
}

function defaultIpRanges() {
  return {
    ipVbmEdge: { min: 0.55, max: 1.7 },
    ipVbmBackground: { min: -3.4, max: -1.6 },
    cutoffEdge: { min: 9.0, max: 11.4 },
    cutoffBackground: { min: 12.2, max: 15.2 },
  };
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
