export function SmallNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label
      className="grid w-[92px] grid-cols-[48px_1fr] items-center gap-1 rounded border border-slate-200 bg-white px-1 py-0.5"
      onWheel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const baseStep = label === "Font" || label === "Sig" ? 1 : label === "Arrow" ? 0.1 : 0.1;
        const step = event.shiftKey ? baseStep * 10 : baseStep;
        const direction = event.deltaY < 0 ? 1 : -1;
        onChange(Number((value + direction * step).toFixed(4)));
      }}
    >
      <span className="font-semibold text-slate-500">{label}</span>
      <input
        className="min-w-0 bg-transparent font-mono text-slate-900 outline-none"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}
