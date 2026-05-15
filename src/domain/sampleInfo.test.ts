import { describe, expect, test } from "vite-plus/test";
import { SAMPLE_HOLDER_OPTIONS, SAMPLE_INFO_FIELDS, elementsFromComposition } from "./sampleInfo";

describe("sample info helpers", () => {
  test("extracts unique elements from nominal composition", () => {
    expect(elementsFromComposition("Li6PS5Cl")).toBe("Li, P, S, Cl");
    expect(elementsFromComposition("La2Zr2O7")).toBe("La, Zr, O");
    expect(elementsFromComposition("")).toBe("");
  });

  test("keeps template vocabulary for selectable fields", () => {
    expect(SAMPLE_HOLDER_OPTIONS).toContain("LEIPS測定対応傾斜試料ホルダ_MOD201");
    expect(SAMPLE_INFO_FIELDS.some((field) => field.field === "holder")).toBe(true);
    expect(SAMPLE_INFO_FIELDS.some((field) => field.field === "nominalComposition")).toBe(true);
  });
});
