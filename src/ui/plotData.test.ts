import { describe, expect, test } from "vite-plus/test";
import type { GaussianFitResult, LineFitResult } from "../domain/types";
import { bandSeries, gaussianSeries, lineFitSeries, xExtent } from "./plotData";

describe("plot data helpers", () => {
  test("extends a line fit to the requested plot extent", () => {
    const fit: LineFitResult = {
      intercept: 1,
      slope: 2,
      rSquared: 1,
      range: { min: 2, max: 3 },
      pointsUsed: 2,
    };

    const series = lineFitSeries("fit", fit, fit.range, "#000000", { min: -1, max: 5 });

    expect(series.affectsScale).toBe(false);
    expect(series.fitRange).toEqual({ min: 2, max: 3 });
    expect(series.points).toEqual([
      { x: -1, y: -1 },
      { x: 5, y: 11 },
    ]);
  });

  test("marks gaussian fit series as scale-neutral", () => {
    const fit: GaussianFitResult = {
      offset: 0,
      amplitude: 1,
      center: 0,
      sigma: 1,
      rSquared: 1,
      range: { min: -1, max: 1 },
      pointsUsed: 3,
    };

    const series = gaussianSeries(
      "fit",
      fit,
      [
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
      ],
      "#000000",
    );

    expect(series.affectsScale).toBe(false);
  });

  test("calculates an x extent from points", () => {
    expect(
      xExtent([
        { x: 4, y: 1 },
        { x: -2, y: 2 },
        { x: 7, y: 3 },
      ]),
    ).toEqual({ min: -2, max: 7 });
  });

  test("assigns band diagram LEIPS data to the right y-axis", () => {
    const series = bandSeries({
      efMinusEvbm: 0.5,
      ip: 5,
      ea: 3,
      eg: 2,
      vacuumRelativeToEf: -4.5,
      cbmRelativeToEf: -1.5,
      upsPoints: [{ x: 0, y: 1 }],
      leipsPoints: [{ x: 1, y: 2 }],
    });

    expect(series[0]?.yAxis).toBe("left");
    expect(series[1]?.yAxis).toBe("right");
  });
});
