import { describe, expect, test } from "vite-plus/test";
import {
  createPlotGeometry,
  createPlotScales,
  formatTickParts,
  fitLabelPointForSeries,
  inferPlotDragZoomMode,
  nextViewportAfterWheel,
  plotXToValue,
  plotYToValue,
  rangeAfterCursorDrag,
  selectionRectForMode,
  shouldRenderSeriesInXDomain,
  shiftRangeByDelta,
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

    expect(geometry.top).toBe(16);
    expect(geometry.left).toBe(78);
    expect(geometry.right).toBe(30);
    expect(geometry.bottom).toBe(36);
    expect(geometry.plotWidth).toBe(212);
    expect(geometry.plotHeight).toBe(188);
  });

  test("uses larger plot margins for band diagrams", () => {
    const geometry = createPlotGeometry({ width: 520, height: 360 }, true, true);

    expect(geometry.top).toBe(44);
    expect(geometry.left).toBe(96);
    expect(geometry.right).toBe(78);
    expect(geometry.bottom).toBe(62);
    expect(geometry.plotWidth).toBe(346);
    expect(geometry.plotHeight).toBe(254);
  });

  test("uses compact left and wider right margins for LEIPS dual-axis plots", () => {
    const geometry = createPlotGeometry({ width: 320, height: 240 }, false, true, "leips");

    expect(geometry.left).toBe(76);
    expect(geometry.right).toBe(70);
    expect(geometry.bottom).toBe(54);
    expect(geometry.plotWidth).toBe(174);
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

  test("keeps hidden-cursor fit labels inside the visible plot area", () => {
    const scales = createPlotScales({
      size: { width: 320, height: 240 },
      series: [{ name: "raw", color: "#000000", points: [{ x: 5, y: 5 }] }],
      viewport: { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } },
      xDirection: "normal",
    });
    const point = fitLabelPointForSeries(
      {
        name: "fit",
        color: "#2563eb",
        fitLabel: "very long VBM edge",
        points: [
          { x: -100, y: 20 },
          { x: 100, y: -20 },
        ],
      },
      scales.xDomain,
      scales.geometry,
      scales.xScale,
      scales.yScale,
    );

    expect(point?.x).toBeGreaterThanOrEqual(scales.geometry.left);
    expect(point?.x).toBeLessThanOrEqual(scales.geometry.plotRight);
    expect(point?.y).toBeGreaterThanOrEqual(scales.geometry.top);
    expect(point?.y).toBeLessThanOrEqual(scales.geometry.plotBottom);
  });

  test("places hidden-cursor fit labels near a visible edge", () => {
    const scales = createPlotScales({
      size: { width: 320, height: 240 },
      series: [{ name: "raw", color: "#000000", points: [{ x: 5, y: 5 }] }],
      viewport: { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } },
      xDirection: "normal",
    });
    const point = fitLabelPointForSeries(
      {
        name: "fit",
        color: "#2563eb",
        fitLabel: "VBM edge",
        points: [
          { x: -100, y: 20 },
          { x: 100, y: -20 },
        ],
      },
      scales.xDomain,
      scales.geometry,
      scales.xScale,
      scales.yScale,
    );

    expect(point?.x).toBeCloseTo(scales.geometry.left + "VBM edge".length * 3.6);
  });

  test("converts plot-relative drag coordinates through absolute SVG scales", () => {
    const normal = createPlotScales({
      size: { width: 320, height: 240 },
      series: [
        {
          name: "raw",
          color: "#000000",
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        },
      ],
      xDirection: "normal",
      viewport: { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } },
    });
    const reverse = createPlotScales({
      size: { width: 320, height: 240 },
      series: [
        {
          name: "raw",
          color: "#000000",
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        },
      ],
      xDirection: "reverse",
      viewport: { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } },
    });

    expect(plotXToValue(normal, 0)).toBeCloseTo(0);
    expect(plotXToValue(normal, normal.geometry.plotWidth)).toBeCloseTo(10);
    expect(plotXToValue(reverse, 0)).toBeCloseTo(10);
    expect(plotXToValue(reverse, reverse.geometry.plotWidth)).toBeCloseTo(0);
    expect(plotYToValue(normal, 0)).toBeCloseTo(10);
    expect(plotYToValue(normal, normal.geometry.plotHeight)).toBeCloseTo(0);
  });

  test("infers x, y and xy drag zoom modes from selection shape", () => {
    expect(inferPlotDragZoomMode(7, 7)).toBeUndefined();
    expect(inferPlotDragZoomMode(120, 4)).toBe("x");
    expect(inferPlotDragZoomMode(5, 100)).toBe("y");
    expect(inferPlotDragZoomMode(80, 80)).toBe("xy");
    expect(inferPlotDragZoomMode(300, 80)).toBe("xy");
    expect(inferPlotDragZoomMode(480, 70)).toBe("x");
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

  test("shifts a range band without changing its width", () => {
    expect(shiftRangeByDelta({ min: 2, max: 5 }, -1.5)).toEqual({ min: 0.5, max: 3.5 });
  });

  test("zooms a range around the pointer anchor", () => {
    expect(zoomRangeAt({ min: 0, max: 10 }, 2, 0.5)).toEqual({ min: 1, max: 6 });
    expect(zoomRangeAt({ min: 0, max: 10 }, 2, 2)).toEqual({ min: -2, max: 18 });
  });

  test("maps wheel gestures to y zoom, x zoom and alt pan modes", () => {
    const scales = createPlotScales({
      size: { width: 320, height: 240 },
      series: [
        {
          name: "raw",
          color: "#000000",
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        },
      ],
      xDirection: "normal",
      viewport: { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } },
    });
    const base = { x: { min: 0, max: 10 }, y: { min: 0, max: 10 } };
    const eventBase = {
      clientX: scales.geometry.left + scales.geometry.plotWidth / 2,
      clientY: scales.geometry.top + scales.geometry.plotHeight / 2,
      currentTarget: {} as EventTarget,
      altKey: false,
      shiftKey: false,
      deltaX: 0,
      deltaY: -100,
    };

    const yZoom = nextViewportAfterWheel(base, scales, eventBase, "normal");
    expect(yZoom.x).toEqual(base.x);
    expect((yZoom.y?.max ?? 0) - (yZoom.y?.min ?? 0)).toBeLessThan(10);

    const xZoom = nextViewportAfterWheel(base, scales, { ...eventBase, shiftKey: true }, "normal");
    expect((xZoom.x?.max ?? 0) - (xZoom.x?.min ?? 0)).toBeLessThan(10);
    expect(xZoom.y).toEqual(base.y);

    const xZoomFromHorizontalWheel = nextViewportAfterWheel(
      base,
      scales,
      { ...eventBase, shiftKey: true, deltaX: -100, deltaY: 0 },
      "normal",
    );
    expect(
      (xZoomFromHorizontalWheel.x?.max ?? 0) - (xZoomFromHorizontalWheel.x?.min ?? 0),
    ).toBeLessThan(10);
    expect(xZoomFromHorizontalWheel.y).toEqual(base.y);

    const xZoomFromShiftTranslatedWheel = nextViewportAfterWheel(
      base,
      scales,
      { ...eventBase, deltaX: -100, deltaY: 0 },
      "normal",
    );
    expect(
      (xZoomFromShiftTranslatedWheel.x?.max ?? 0) - (xZoomFromShiftTranslatedWheel.x?.min ?? 0),
    ).toBeLessThan(10);
    expect(xZoomFromShiftTranslatedWheel.y).toEqual(base.y);

    const yPan = nextViewportAfterWheel(base, scales, { ...eventBase, altKey: true }, "normal");
    expect((yPan.y?.max ?? 0) - (yPan.y?.min ?? 0)).toBe(10);
    expect(yPan.y?.min).not.toBe(0);

    const xPan = nextViewportAfterWheel(
      base,
      scales,
      { ...eventBase, altKey: true, shiftKey: true },
      "normal",
    );
    expect((xPan.x?.max ?? 0) - (xPan.x?.min ?? 0)).toBe(10);
    expect(xPan.x?.min).not.toBe(0);
  });

  test("hides fit series when both fit cursors are outside the visible x domain", () => {
    expect(shouldRenderSeriesInXDomain({ fitRange: { min: 1, max: 2 } }, { min: 3, max: 5 })).toBe(
      false,
    );
    expect(shouldRenderSeriesInXDomain({ fitRange: { min: 6, max: 8 } }, { min: 3, max: 5 })).toBe(
      false,
    );
    expect(shouldRenderSeriesInXDomain({ fitRange: { min: 2, max: 4 } }, { min: 3, max: 5 })).toBe(
      true,
    );
    expect(shouldRenderSeriesInXDomain({}, { min: 3, max: 5 })).toBe(true);
  });

  test("formats large tick labels as mantissa and superscript exponent parts", () => {
    expect(formatTickParts(2_000_000)).toEqual({ mantissa: "2.0", exponent: 6 });
    expect(formatTickParts(-12_000)).toEqual({ mantissa: "-1.2", exponent: 4 });
    expect(formatTickParts(120)).toEqual({ mantissa: "120" });
  });
});
