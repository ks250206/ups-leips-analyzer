import { describe, expect, test } from "vite-plus/test";
import {
  createPlotGeometry,
  createPlotScales,
  inferPlotDragZoomMode,
  rangeAfterCursorDrag,
  selectionRectForMode,
  zoomRangeAt,
} from "./SpectrumPlot";

describe("SpectrumPlot D3 scales", () => {
  test("sets reversed x scale range", () => {
    const scales = createPlotScales({
      size: { width: 320, height: 240 },
      series: [{ name: "s", color: "#000000", points: [{ x: 1, y: 1 }] }],
      xDirection: "reverse",
    });

    expect(scales.xScale.range()[0]).toBe(scales.geometry.plotRight);
    expect(scales.xScale.range()[1]).toBe(scales.geometry.left);
  });

  test("sets normal x scale range", () => {
    const scales = createPlotScales({
      size: { width: 320, height: 240 },
      series: [{ name: "s", color: "#000000", points: [{ x: 1, y: 1 }] }],
      xDirection: "normal",
    });

    expect(scales.xScale.range()[0]).toBe(scales.geometry.left);
    expect(scales.xScale.range()[1]).toBe(scales.geometry.plotRight);
  });

  test("keeps visible axis space on normal plots", () => {
    const geometry = createPlotGeometry({ width: 320, height: 240 });

    expect(geometry.top).toBe(40);
    expect(geometry.left).toBe(64);
    expect(geometry.right).toBe(58);
    expect(geometry.bottom).toBe(44);
    expect(geometry.plotWidth).toBe(198);
    expect(geometry.plotHeight).toBe(156);
  });

  test("uses larger plot margins for band diagrams", () => {
    const geometry = createPlotGeometry({ width: 520, height: 360 }, true);

    expect(geometry.top).toBe(68);
    expect(geometry.left).toBe(92);
    expect(geometry.right).toBe(92);
    expect(geometry.bottom).toBe(70);
    expect(geometry.plotWidth).toBe(336);
    expect(geometry.plotHeight).toBe(222);
  });

  test("creates a right y scale for dual-axis plots", () => {
    const scales = createPlotScales({
      size: { width: 320, height: 240 },
      series: [
        { name: "UPS", color: "#2563eb", points: [{ x: 1, y: 1 }], yAxis: "left" },
        { name: "LEIPS", color: "#dc2626", points: [{ x: 1, y: 10 }], yAxis: "right" },
      ],
      xDirection: "reverse",
    });

    expect(scales.yRightScale).toBeDefined();
    expect(scales.yRightDomain?.min).toBeLessThan(10);
    expect(scales.yRightDomain?.max).toBeGreaterThan(10);
  });

  test("excludes fit series from automatic x and y scaling", () => {
    const scales = createPlotScales({
      size: { width: 320, height: 240 },
      series: [
        { name: "raw", color: "#000000", points: [{ x: 1, y: 1 }] },
        { name: "fit", color: "#dc2626", points: [{ x: 100, y: 999 }], affectsScale: false },
      ],
      xDirection: "normal",
    });

    expect(scales.xDomain.max).toBeLessThan(100);
    expect(scales.yDomain.max).toBeLessThan(999);
  });

  test("infers x, y and xy drag zoom modes from selection shape", () => {
    expect(inferPlotDragZoomMode(7, 7)).toBeUndefined();
    expect(inferPlotDragZoomMode(120, 4)).toBe("x");
    expect(inferPlotDragZoomMode(5, 100)).toBe("y");
    expect(inferPlotDragZoomMode(80, 80)).toBe("xy");
  });

  test("extends visual selection rectangles for axis-only zoom", () => {
    const plotSize = { width: 640, height: 360 };

    expect(selectionRectForMode({ left: 20, top: 100 }, { left: 180, top: 104 }, plotSize)).toEqual(
      { left: 20, top: 0, width: 160, height: 360 },
    );
    expect(selectionRectForMode({ left: 120, top: 40 }, { left: 124, top: 180 }, plotSize)).toEqual(
      { left: 0, top: 40, width: 640, height: 140 },
    );
    expect(selectionRectForMode({ left: 120, top: 40 }, { left: 220, top: 140 }, plotSize)).toEqual(
      { left: 120, top: 40, width: 100, height: 100 },
    );
  });

  test("normalizes cursor handle range updates", () => {
    const band = { min: 2, max: 5 };

    expect(rangeAfterCursorDrag(band, "min", 6)).toEqual({ min: 5, max: 6 });
    expect(rangeAfterCursorDrag(band, "max", 1)).toEqual({ min: 1, max: 2 });
  });

  test("zooms a range around the pointer anchor", () => {
    expect(zoomRangeAt({ min: 0, max: 10 }, 2, 0.5)).toEqual({ min: 1, max: 6 });
    expect(zoomRangeAt({ min: 0, max: 10 }, 2, 2)).toEqual({ min: -2, max: 18 });
  });
});
