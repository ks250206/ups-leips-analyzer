import type { SpectrumDataset } from "../domain/types";

export function axisLabelForDatasetKind(kind: SpectrumDataset["kind"]): string {
  if (kind === "leet" || kind === "leet-der" || kind === "leips") {
    return "Applied Bias Vbias / V";
  }
  if (kind === "reels") {
    return "Kinetic Energy / eV";
  }
  return "Binding Energy / eV";
}
