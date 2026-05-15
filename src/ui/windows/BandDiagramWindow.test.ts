import { describe, expect, test } from "vite-plus/test";
import { createIgorBandModel } from "./BandDiagramWindow";

describe("Igor-style band diagram plot model", () => {
  test("renders energy axis reversed like the Igor band diagram", () => {
    const model = createIgorBandModel({
      band: {
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
      },
      xDomain: { min: -6, max: 4 },
      upsScale: 1,
      upsOffset: 0,
      leipsScale: 1,
      leipsOffset: 0,
      geometry: { left: 100, top: 50, plotRight: 800, plotBottom: 500 },
    });

    expect(model.xScale(4)).toBe(100);
    expect(model.xScale(-6)).toBe(800);
    expect(model.upsPath).toContain("L");
    expect(model.leipsPath).toContain("L");
  });
});
