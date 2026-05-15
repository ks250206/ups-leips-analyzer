export function formatNumber(value: number | undefined, digits = 3): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  return value.toFixed(digits);
}

export function formatRange(min: number, max: number): string {
  return `${formatNumber(min, 2)} to ${formatNumber(max, 2)}`;
}

export function formatSignificant(value: number | undefined, digits = 4): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "-";
  }
  return value.toPrecision(Math.max(1, Math.round(digits)));
}
