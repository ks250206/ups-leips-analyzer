import { createDemoDatasets } from "../domain/demoData";
import type { FitTarget, UPSIPResult } from "../domain/types";
import { DEFAULT_CATALOG_ID, DEFAULT_CATALOG_NAME } from "./projectDb";
import { useProjectStore } from "./projectStore";

export const FIT_TARGETS: FitTarget[] = [
  "ups-vb-edge",
  "ups-vb-bg",
  "ups-ip-vbm-edge",
  "ups-ip-vbm-bg",
  "ups-ip-edge",
  "ups-ip-bg",
  "leet-der-peak",
  "leips-edge",
  "leips-bg",
  "reels-edge",
  "reels-bg",
];

export function resetProjectStoreWithDemo() {
  useProjectStore.setState({
    activeCatalog: {
      id: DEFAULT_CATALOG_ID,
      name: DEFAULT_CATALOG_NAME,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      lastOpenedAt: new Date(0).toISOString(),
    },
    isProjectUnsaved: true,
  });
  useProjectStore.getState().loadDemo();
}

export function prefixedDemoDatasets(prefix: string) {
  return createDemoDatasets().map((dataset) => ({
    ...dataset,
    id: `${prefix}-${dataset.id}`,
    name: `${titleCase(prefix)} ${dataset.name}`,
  }));
}

export function upsIpResultFixture(
  override: Partial<UPSIPResult> & Pick<UPSIPResult, "datasetId" | "appliedVoltage" | "ip">,
): UPSIPResult {
  return {
    datasetName: "IP",
    photonEnergy: 21.22,
    ipEvbm: 0,
    ecutoff: 0,
    ipVbmEdge: { intercept: 0, slope: 0, rSquared: 1, range: { min: 0, max: 1 }, pointsUsed: 2 },
    ipVbmBackground: {
      intercept: 0,
      slope: 0,
      rSquared: 1,
      range: { min: 0, max: 1 },
      pointsUsed: 2,
    },
    cutoffEdge: {
      intercept: 0,
      slope: 0,
      rSquared: 1,
      range: { min: 0, max: 1 },
      pointsUsed: 2,
    },
    cutoffBackground: {
      intercept: 0,
      slope: 0,
      rSquared: 1,
      range: { min: 0, max: 1 },
      pointsUsed: 2,
    },
    ...override,
  };
}

function titleCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
