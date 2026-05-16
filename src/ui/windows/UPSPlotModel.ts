import type { FitRange, FitTarget } from "../../domain/types";
import type { PlotViewport } from "./SpectrumPlot";

export const BIAS_PLOTS = [
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

export function defaultIpRanges() {
  return {
    ipVbmEdge: { min: 0.55, max: 1.7 },
    ipVbmBackground: { min: -3.4, max: -1.6 },
    cutoffEdge: { min: 9.0, max: 11.4 },
    cutoffBackground: { min: 12.2, max: 15.2 },
  };
}

export function viewportAroundRanges(ranges: readonly FitRange[]): PlotViewport {
  const min = Math.min(...ranges.map((range) => Math.min(range.min, range.max)));
  const max = Math.max(...ranges.map((range) => Math.max(range.min, range.max)));
  const padding = Math.max((max - min) * 0.3, 0.25);
  return { x: { min: min - padding, max: max + padding } };
}

export function vbTarget(active: FitTarget): FitTarget {
  return active === "ups-vb-edge" || active === "ups-vb-bg" ? active : "ups-vb-edge";
}

export function ipTarget(active: FitTarget): FitTarget {
  return active === "ups-ip-vbm-edge" ||
    active === "ups-ip-vbm-bg" ||
    active === "ups-ip-edge" ||
    active === "ups-ip-bg"
    ? active
    : "ups-ip-vbm-edge";
}
