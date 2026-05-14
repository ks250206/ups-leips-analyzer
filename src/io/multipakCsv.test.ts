import { describe, expect, test } from "vite-plus/test";
import { inferSpectrumKind, parseMultiPakCsv } from "./multipakCsv";

const CSV = `2
no area description
IP
1,2
file#,2,4
16.40,880.0,580.0
16.39,1040.0,570.0
16.38,880.0,550.0
`;

describe("parseMultiPakCsv", () => {
  test("expands MultiPak CSV y columns into datasets", () => {
    const datasets = parseMultiPakCsv(CSV, { sourceName: "sample_UPS IP.csv" });
    expect(datasets).toHaveLength(2);
    expect(datasets[0]?.kind).toBe("ups-ip");
    expect(datasets[0]?.points[0]).toEqual({ x: 16.4, y: 880 });
    expect(datasets[1]?.name).toContain("#4");
  });

  test("infers spectrum kinds from filenames", () => {
    expect(inferSpectrumKind("UPS VB.csv")).toBe("ups-vb");
    expect(inferSpectrumKind("LEET der 1st.spe.csv")).toBe("leet-der");
    expect(inferSpectrumKind("LEET 1st.spe.csv")).toBe("leet");
    expect(inferSpectrumKind("LEIPS 2nd.spe.csv")).toBe("leips");
    expect(inferSpectrumKind("unknown.txt")).toBe("unknown");
  });

  test("supports forced kinds and 0,0 termination", () => {
    const csv = `unknown area
desc
raw
1,1
file#
1,2
0,0
2,5
`;
    const datasets = parseMultiPakCsv(csv, { sourceName: "raw.csv", forcedKind: "leips" });
    expect(datasets).toHaveLength(1);
    expect(datasets[0]?.kind).toBe("leips");
    expect(datasets[0]?.points).toEqual([{ x: 1, y: 2 }]);
  });

  test("rejects invalid CSV shapes", () => {
    expect(() => parseMultiPakCsv("too\nshort", { sourceName: "bad.csv" })).toThrow(
      "at least five metadata rows",
    );
    expect(() =>
      parseMultiPakCsv(
        `a
b
c
d
file#
1
2
`,
        { sourceName: "bad.csv" },
      ),
    ).toThrow("one x column");
  });
});
