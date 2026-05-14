import { describe, expect, test } from "vite-plus/test";
import { createSpectrumPlotOptions } from "./SpectrumPlot";

describe("SpectrumPlot options", () => {
  test("sets reversed x scale direction", () => {
    const options = createSpectrumPlotOptions({
      size: { width: 320, height: 240 },
      title: "reverse",
      xLabel: "x",
      yLabel: "y",
      series: [{ name: "s", color: "#000000", points: [{ x: 1, y: 1 }] }],
      markers: [],
      rangeBands: [],
      xDirection: "reverse",
    });

    expect(options.scales?.x?.dir).toBe(-1);
  });

  test("sets normal x scale direction", () => {
    const options = createSpectrumPlotOptions({
      size: { width: 320, height: 240 },
      title: "normal",
      xLabel: "x",
      yLabel: "y",
      series: [{ name: "s", color: "#000000", points: [{ x: 1, y: 1 }] }],
      markers: [],
      rangeBands: [],
      xDirection: "normal",
    });

    expect(options.scales?.x?.dir).toBe(1);
  });
});
