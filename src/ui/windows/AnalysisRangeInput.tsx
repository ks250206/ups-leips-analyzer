import { useEffect, useState } from "react";

export function RangeNumberInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(formatFitValue(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatFitValue(value));
    }
  }, [focused, value]);

  return (
    <input
      className="min-w-0 rounded border border-slate-300 bg-white px-1 py-0.5 font-mono"
      inputMode="decimal"
      value={draft}
      onBlur={() => {
        setFocused(false);
        if (!Number.isFinite(Number(draft))) {
          setDraft(formatFitValue(value));
        }
      }}
      onChange={(event) => {
        const next = event.currentTarget.value;
        setDraft(next);
        if (isIncompleteNumber(next)) {
          return;
        }
        const parsed = Number(next);
        if (Number.isFinite(parsed)) {
          onChange(parsed);
        }
      }}
      onFocus={() => setFocused(true)}
    />
  );
}

function formatFitValue(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "";
}

function isIncompleteNumber(value: string): boolean {
  return value === "" || value === "-" || value === "." || value === "-.";
}
