import { describe, expect, test } from "vite-plus/test";
import { gaussianFit, lineIntersection, linearFit } from "./fit";
import type { Point } from "./types";

describe("linearFit", () => {
  test("fits y = intercept + slope * x", () => {
    const points: Point[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const fit = linearFit(points, { min: 0, max: 3 });
    expect(fit.intercept).toBeCloseTo(1, 6);
    expect(fit.slope).toBeCloseTo(2, 6);
    expect(fit.rSquared).toBeCloseTo(1, 6);
  });

  test("calculates the edge/background intersection", () => {
    const edge = linearFit(
      [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
      ],
      { min: 0, max: 1 },
    );
    const background = linearFit(
      [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      { min: 0, max: 1 },
    );
    expect(lineIntersection(edge, background)).toBeCloseTo(0.5, 6);
  });

  test("rejects invalid linear fits", () => {
    expect(() => linearFit([{ x: 0, y: 1 }], { min: 0, max: 1 })).toThrow(
      "Linear fit requires at least two points",
    );
    expect(() =>
      linearFit(
        [
          { x: 0, y: 1 },
          { x: 0, y: 2 },
        ],
        { min: 0, max: 1 },
      ),
    ).toThrow("all x values");
  });

  test("rejects nearly parallel intersections", () => {
    const first = linearFit(
      [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ],
      { min: 0, max: 1 },
    );
    const second = linearFit(
      [
        { x: 0, y: 2 },
        { x: 1, y: 3 },
      ],
      { min: 0, max: 1 },
    );
    expect(() => lineIntersection(first, second)).toThrow("parallel");
  });
});

describe("gaussianFit", () => {
  test("recovers the peak center", () => {
    const points = Array.from({ length: 101 }, (_, index) => {
      const x = -8 + index * 0.04;
      return { x, y: 3 + 50 * Math.exp(-0.5 * ((x + 6.24) / 0.32) ** 2) };
    });
    const fit = gaussianFit(points, { min: -7, max: -5.5 });
    expect(fit.center).toBeCloseTo(-6.24, 2);
    expect(fit.sigma).toBeGreaterThan(0);
  });

  test("rejects Gaussian ranges with too few points", () => {
    expect(() => gaussianFit([{ x: 0, y: 1 }], { min: 0, max: 1 })).toThrow(
      "Gaussian fit requires at least four points",
    );
  });
});
