import { describe, expect, test } from "vite-plus/test";
import {
  bandPlotDataSignature,
  createBandAutoViewport,
  createIgorBandModel,
} from "./bandDiagramModel";
import { bandArrowMarkerProps } from "./BandDiagramAnnotations";
import {
  nextIgorBandViewportAfterDrag,
  nextIgorBandViewportAfterWheel,
} from "./bandDiagramInteraction";
import {
  DEFAULT_BAND_INDICATOR_ARROW_SCALE,
  DEFAULT_BAND_INDICATOR_FONT_SIZE,
  DEFAULT_BAND_SIGNIFICANT_DIGITS,
  DEFAULT_BAND_X_RANGE,
  clampSignificantDigits,
} from "./BandDiagramWindow";
import { formatSignificant } from "../format";

const BAND = {
  efMinusEvbm: 1,
  ip: 5.9,
  ea: 3.12,
  eg: 2.78,
  vacuumRelativeToEf: -4.9,
  cbmRelativeToEf: -1.78,
  upsPoints: [
    { x: 4, y: 10 },
    { x: 0, y: 0 },
  ],
  leipsPoints: [
    { x: -6, y: 20 },
    { x: -2, y: 0 },
  ],
};

function model() {
  return createIgorBandModel({
    band: BAND,
    xDomain: { min: -6, max: 4 },
    upsScale: 1,
    upsOffset: 0,
    leipsScale: 1,
    leipsOffset: 0,
    geometry: { left: 100, top: 50, plotRight: 800, plotBottom: 500 },
  });
}

describe("Igor-style band diagram plot model", () => {
  test("uses compact default annotation controls", () => {
    expect(DEFAULT_BAND_INDICATOR_FONT_SIZE).toBe(30);
    expect(DEFAULT_BAND_INDICATOR_ARROW_SCALE).toBe(0.7);
    expect(DEFAULT_BAND_SIGNIFICANT_DIGITS).toBe(3);
    expect(DEFAULT_BAND_X_RANGE).toEqual({ min: -5, max: 8 });
    expect(clampSignificantDigits(2.2)).toBe(2);
    expect(clampSignificantDigits(99)).toBe(8);
    expect(formatSignificant(5.1, 3)).toBe("5.10");
  });

  test("can render one-sided left arrowheads for IP and EA", () => {
    expect(bandArrowMarkerProps("arrow", "left")).toEqual({
      markerEnd: undefined,
      markerStart: "url(#arrow)",
    });
    expect(bandArrowMarkerProps("arrow", "both")).toEqual({
      markerEnd: "url(#arrow)",
      markerStart: "url(#arrow)",
    });
  });

  test("renders energy axis reversed like the Igor band diagram", () => {
    const current = model();

    expect(current.xScale(4)).toBe(100);
    expect(current.xScale(-6)).toBe(800);
    expect(current.upsPath).toContain("L");
    expect(current.leipsPath).toContain("L");
  });

  test("applies UPS and LEIPS offsets as percent of each raw intensity span", () => {
    const shifted = createIgorBandModel({
      band: BAND,
      xDomain: { min: -6, max: 4 },
      upsScale: 1,
      upsOffset: 10,
      leipsScale: 1,
      leipsOffset: 10,
      geometry: { left: 100, top: 50, plotRight: 800, plotBottom: 500 },
    });

    expect(shifted.yDomain.min).toBeCloseTo(0.8);
    expect(shifted.yRightDomain.min).toBeCloseTo(1.6);
  });

  test("keeps explicit auto domains fixed after changing offsets", () => {
    const auto = createBandAutoViewport({
      band: BAND,
      xDomain: { min: -6, max: 4 },
      upsScale: 1,
      upsOffset: 0,
      leipsScale: 1,
      leipsOffset: 0,
    });
    const shifted = createIgorBandModel({
      band: BAND,
      xDomain: { min: -6, max: 4 },
      upsScale: 1,
      upsOffset: 20,
      leipsScale: 1,
      leipsOffset: 20,
      viewport: auto,
      geometry: { left: 100, top: 50, plotRight: 800, plotBottom: 500 },
    });

    expect(shifted.yDomain).toEqual(auto.y);
    expect(shifted.yRightDomain).toEqual(auto.y2);
  });

  test("auto viewport ignores display scale and offsets", () => {
    const normal = createBandAutoViewport({
      band: BAND,
      xDomain: { min: -6, max: 4 },
      upsScale: 1,
      upsOffset: 0,
      leipsScale: 1,
      leipsOffset: 0,
    });
    const transformed = createBandAutoViewport({
      band: BAND,
      xDomain: { min: -6, max: 4 },
      upsScale: 10,
      upsOffset: 50,
      leipsScale: 0.1,
      leipsOffset: -50,
    });

    expect(transformed).toEqual(normal);
  });

  test("keeps the band data signature stable across recalculated annotation values", () => {
    const recalculated = {
      ...BAND,
      ip: 3.2,
      ea: 1.1,
      eg: 2.1,
      cbmRelativeToEf: -0.9,
    };
    const changedData = {
      ...BAND,
      leipsPoints: BAND.leipsPoints.map((point) => ({ ...point, x: point.x + 0.2 })),
    };

    expect(bandPlotDataSignature(recalculated)).toBe(bandPlotDataSignature(BAND));
    expect(bandPlotDataSignature(changedData)).not.toBe(bandPlotDataSignature(BAND));
  });

  test("zooms x with shift wheel and y axes with normal wheel", () => {
    const current = model();
    const base = { x: { min: -6, max: 4 }, y: current.yDomain, y2: current.yRightDomain };
    const eventBase = {
      altKey: false,
      clientX: 450,
      clientY: 275,
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 860, height: 620 }),
      } as unknown as EventTarget,
      deltaX: 0,
      deltaY: -100,
      shiftKey: false,
    };

    const yZoom = nextIgorBandViewportAfterWheel(base, current, eventBase);
    expect((yZoom.y?.max ?? 0) - (yZoom.y?.min ?? 0)).toBeLessThan(base.y.max - base.y.min);
    expect(yZoom.x).toEqual(base.x);

    const xZoom = nextIgorBandViewportAfterWheel(base, current, {
      ...eventBase,
      shiftKey: true,
    });
    expect((xZoom.x?.max ?? 0) - (xZoom.x?.min ?? 0)).toBeLessThan(10);
  });

  test("drag zoom narrows x and y domains", () => {
    const current = model();
    const next = nextIgorBandViewportAfterDrag(
      { x: { min: -6, max: 4 }, y: current.yDomain, y2: current.yRightDomain },
      current,
      { left: 100, top: 100 },
      { left: 500, top: 350 },
    );

    expect((next.x?.max ?? 0) - (next.x?.min ?? 0)).toBeLessThan(10);
    expect((next.y?.max ?? 0) - (next.y?.min ?? 0)).toBeLessThan(
      current.yDomain.max - current.yDomain.min,
    );
  });
});
