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

  test("can hide y-axis tick values for dual-axis band diagrams", () => {
    const options = createSpectrumPlotOptions({
      size: { width: 320, height: 240 },
      title: "dual",
      xLabel: "x",
      yLabel: "UPS",
      yRightLabel: "LEIPS",
      hideYTicks: true,
      series: [
        { name: "UPS", color: "#2563eb", points: [{ x: 1, y: 1 }], yAxis: "left" },
        { name: "LEIPS", color: "#dc2626", points: [{ x: 1, y: 1 }], yAxis: "right" },
      ],
      markers: [],
      rangeBands: [],
      xDirection: "reverse",
    });

    expect(options.axes?.[1]?.label).toBe("UPS");
    const leftValues = options.axes?.[1]?.values as
      | ((
          self: never,
          splits: number[],
          axisIdx: number,
          foundSpace: number,
          foundIncr: number,
        ) => unknown[])
      | undefined;
    const rightValues = options.axes?.[2]?.values as
      | ((
          self: never,
          splits: number[],
          axisIdx: number,
          foundSpace: number,
          foundIncr: number,
        ) => unknown[])
      | undefined;

    expect(leftValues?.({} as never, [], 1, 10, 0)).toEqual([]);
    expect(options.axes?.[2]?.label).toBe("LEIPS");
    expect(rightValues?.({} as never, [], 2, 10, 0)).toEqual([]);
    expect(options.series?.[2]?.scale).toBe("y2");
  });
});
