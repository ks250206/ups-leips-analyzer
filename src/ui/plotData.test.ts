import { describe, expect, test } from "vite-plus/test";
import type { LineFitResult } from "../domain/types";
import { lineFitSeries, xExtent } from "./plotData";

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

    expect(series.points).toEqual([
      { x: -1, y: -1 },
      { x: 5, y: 11 },
    ]);
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
});
