import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SelectFieldProps {
  ariaLabel?: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (value: string) => void;
}

interface MultiSelectFieldProps {
  ariaLabel?: string;
  values: readonly string[];
  options: readonly string[];
  placeholder?: string;
  onChange: (values: string[]) => void;
}

const buttonClass =
  "flex min-w-0 items-center justify-between gap-2 rounded border border-slate-300 bg-white px-2 py-1 text-left hover:bg-slate-50";

export function SelectField({
  ariaLabel,
  value,
  options,
  placeholder,
  onChange,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useCloseOnOutsidePointer(setOpen);
  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        aria-expanded={open}
        aria-label={ariaLabel}
        className={buttonClass}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? "truncate text-slate-800" : "truncate text-slate-400"}>
          {value || placeholder || "-"}
        </span>
        <ChevronDown size={14} className="shrink-0 text-slate-500" />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+2px)] z-[10020] max-h-56 min-w-full overflow-auto rounded border border-slate-300 bg-white py-1 shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              className="flex w-full items-center justify-between gap-4 px-2 py-1.5 text-left hover:bg-cyan-50"
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <span className="truncate">{option}</span>
              {option === value ? <Check size={13} className="shrink-0 text-slate-700" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MultiSelectField({
  ariaLabel,
  values,
  options,
  placeholder,
  onChange,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useCloseOnOutsidePointer(setOpen);
  const selected = new Set(values);
  const label = values.length > 0 ? values.join(", ") : placeholder || "-";
  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        aria-expanded={open}
        aria-label={ariaLabel}
        className={buttonClass}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={values.length > 0 ? "truncate text-slate-800" : "truncate text-slate-400"}>
          {label}
        </span>
        <ChevronDown size={14} className="shrink-0 text-slate-500" />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+2px)] z-[10020] max-h-56 min-w-full overflow-auto rounded border border-slate-300 bg-white py-1 shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              className="flex w-full items-center justify-between gap-4 px-2 py-1.5 text-left hover:bg-cyan-50"
              type="button"
              onClick={() => {
                const next = new Set(selected);
                if (next.has(option)) {
                  next.delete(option);
                } else {
                  next.add(option);
                }
                onChange([...next]);
              }}
            >
              <span className="truncate">{option}</span>
              {selected.has(option) ? (
                <Check size={13} className="shrink-0 text-slate-700" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function useCloseOnOutsidePointer(setOpen: (open: boolean) => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [setOpen]);
  return rootRef;
}
