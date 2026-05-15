import { describe, expect, test } from "vite-plus/test";
import {
  createIgorBandModel,
  nextIgorBandViewportAfterDrag,
  nextIgorBandViewportAfterWheel,
} from "./BandDiagramWindow";

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
  test("renders energy axis reversed like the Igor band diagram", () => {
    const current = model();

    expect(current.xScale(4)).toBe(100);
    expect(current.xScale(-6)).toBe(800);
    expect(current.upsPath).toContain("L");
    expect(current.leipsPath).toContain("L");
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
