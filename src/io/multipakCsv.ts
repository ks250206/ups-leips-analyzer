import type { SpectrumDataset, SpectrumKind } from "../domain/types";

export interface ParseMultiPakOptions {
  sourceName: string;
  forcedKind?: SpectrumKind;
}

export function parseMultiPakCsv(text: string, options: ParseMultiPakOptions): SpectrumDataset[] {
  const rows = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rows.length < 6) {
    throw new Error("MultiPak CSV requires at least five metadata rows and one numeric row.");
  }

  const metadataRows = rows.slice(0, 5);
  const kindText = metadataRows[2] ?? "";
  const header = splitCsvLine(metadataRows[4] ?? "");
  const numericRows = rows
    .slice(5)
    .map(splitCsvLine)
    .filter((row) => row.length >= 2);
  const columns = transposeNumericRows(numericRows);
  if (columns.length < 2) {
    throw new Error("MultiPak CSV must contain one x column and at least one y column.");
  }

  const xColumn = columns[0];
  const datasets: SpectrumDataset[] = [];
  for (let yIndex = 1; yIndex < columns.length; yIndex += 1) {
    const yColumn = columns[yIndex];
    const points = xColumn
      .map((x, index) => ({ x, y: yColumn[index] }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (points.length === 0) {
      continue;
    }
    const seriesLabel = header[yIndex] && header[yIndex] !== "" ? header[yIndex] : `${yIndex}`;
    const kind = options.forcedKind ?? inferSpectrumKind(`${options.sourceName} ${kindText}`);
    datasets.push({
      id: createDatasetId(options.sourceName, yIndex),
      name:
        columns.length > 2
          ? `${stripExtension(options.sourceName)} #${seriesLabel}`
          : stripExtension(options.sourceName),
      sourceName: options.sourceName,
      kind,
      xLabel: axisLabelForKind(kind),
      yLabel: "Intensity / a.u.",
      points,
      metadata: {
        area: metadataRows[0] ?? "",
        description: metadataRows[1] ?? "",
        kind: kindText,
        series: metadataRows[3] ?? "",
        columns: metadataRows[4] ?? "",
      },
    });
  }

  if (datasets.length === 0) {
    throw new Error("MultiPak CSV did not contain any numeric datasets.");
  }
  return datasets;
}

export function inferSpectrumKind(value: string): SpectrumKind {
  const normalized = value.toLowerCase();
  if (normalized.includes("reels")) {
    return "reels";
  }
  if (normalized.includes("leips")) {
    return "leips";
  }
  if (normalized.includes("leet") && normalized.includes("der")) {
    return "leet-der";
  }
  if (normalized.includes("leet")) {
    return "leet";
  }
  if (normalized.includes("ups") && normalized.includes("vb")) {
    return "ups-vb";
  }
  if (normalized.includes("ip")) {
    return "ups-ip";
  }
  return "unknown";
}

function splitCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
}

function transposeNumericRows(rows: string[][]): number[][] {
  const width = Math.max(...rows.map((row) => row.length));
  const columns = Array.from({ length: width }, () => [] as number[]);
  for (const row of rows) {
    const values = row.map((cell) => Number.parseFloat(cell));
    if (values.length >= 2 && values[0] === 0 && values[1] === 0) {
      break;
    }
    values.forEach((value, index) => {
      if (Number.isFinite(value)) {
        columns[index].push(value);
      }
    });
  }
  return columns.filter((column) => column.length > 0);
}

function createDatasetId(sourceName: string, yIndex: number): string {
  const slug = sourceName
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "dataset"}-${yIndex}`;
}

function stripExtension(sourceName: string): string {
  return sourceName.replace(/\.[^.]+$/, "");
}

function axisLabelForKind(kind: SpectrumKind): string {
  if (kind === "leet" || kind === "leet-der" || kind === "leips") {
    return "Applied Bias Vbias / V";
  }
  if (kind === "reels") {
    return "Kinetic Energy / eV";
  }
  return "Binding Energy / eV";
}
