import { BANDPASS_OPTIONS, CUSTOM_BANDPASS_TYPE } from "../../domain/constants";
import { useEffect, useState, type ReactNode } from "react";
import type { AnalysisSelection, FitRange, FitTarget, SpectrumDataset } from "../../domain/types";
import { fitRangeKey, useProjectStore } from "../../store/projectStore";
import { formatNumber, formatRange } from "../format";

const FIT_TARGETS: Array<{ target: FitTarget; label: string }> = [
  { target: "ups-vb-edge", label: "VB set edge" },
  { target: "ups-vb-bg", label: "BG(VB set)" },
  { target: "ups-ip-vbm-edge", label: "IP EVBM edge" },
  { target: "ups-ip-vbm-bg", label: "BG(IP EVBM)" },
  { target: "ups-ip-edge", label: "Ecut-off edge" },
  { target: "ups-ip-bg", label: "BG(Ecut-off)" },
  { target: "leet-der-peak", label: "LEET(der) peak" },
  { target: "leips-edge", label: "CBM edge" },
  { target: "leips-bg", label: "BG(LEIPS)" },
  { target: "reels-edge", label: "REELS onset" },
  { target: "reels-bg", label: "BG(REELS)" },
];

const DATASET_SLOTS: Array<{
  slot: keyof AnalysisSelection;
  label: string;
  filter: (dataset: SpectrumDataset) => boolean;
}> = [
  { slot: "upsVbDatasetId", label: "UPS VB", filter: (dataset) => dataset.kind === "ups-vb" },
  { slot: "upsIpDatasetId", label: "UPS IP", filter: (dataset) => dataset.kind === "ups-ip" },
  { slot: "leetDatasetId", label: "LEET", filter: (dataset) => dataset.kind === "leet" },
  {
    slot: "leetDerDatasetId",
    label: "LEET(der)",
    filter: (dataset) => dataset.kind === "leet-der",
  },
  { slot: "leipsDatasetId", label: "LEIPS", filter: (dataset) => dataset.kind === "leips" },
  { slot: "reelsDatasetId", label: "REELS", filter: (dataset) => dataset.kind === "reels" },
];

type AnalysisTab = "data" | "ups" | "leips" | "reels" | "band" | "fit";

export function AnalysisControls({ activeTab = "data" }: { activeTab?: AnalysisTab }) {
  const project = useProjectStore((state) => state.project);
  const activeFitTarget = useProjectStore((state) => state.activeFitTarget);
  const assignDataset = useProjectStore((state) => state.assignDataset);
  const setFitRange = useProjectStore((state) => state.setFitRange);
  const setActiveFitTarget = useProjectStore((state) => state.setActiveFitTarget);
  const setBandpassType = useProjectStore((state) => state.setBandpassType);
  const setCustomBandpassEnergy = useProjectStore((state) => state.setCustomBandpassEnergy);
  const setReelsIncidentEnergy = useProjectStore((state) => state.setReelsIncidentEnergy);
  const setEfMinusEvbm = useProjectStore((state) => state.setEfMinusEvbm);
  const recalculate = useProjectStore((state) => state.recalculate);
  const analysis = project.analysis;
  const [tab, setTab] = useState<AnalysisTab>(activeTab);
  useEffect(() => setTab(activeTab), [activeTab]);

  return (
    <div className="flex h-full flex-col bg-slate-100 text-xs">
      {analysis.error ? (
        <div className="border-b border-red-200 bg-red-50 p-2 font-semibold text-red-700">
          {analysis.error}
        </div>
      ) : null}
      <div className="grid grid-cols-6 gap-1 border-b border-slate-300 bg-slate-200 p-2">
        {[
          ["data", "Data"],
          ["ups", "UPS"],
          ["leips", "LEIPS"],
          ["reels", "REELS"],
          ["band", "Band"],
          ["fit", "Fit"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={
              tab === id
                ? "rounded border border-slate-700 bg-slate-800 px-2 py-1 font-semibold text-white shadow-sm"
                : "rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 hover:bg-slate-100"
            }
            type="button"
            onClick={() => setTab(id as typeof tab)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "data" ? (
          <Panel title="Datasets">
            <div className="grid gap-2">
              {DATASET_SLOTS.map((item) => (
                <label key={item.slot} className="grid grid-cols-[82px_1fr] items-center gap-2">
                  <span className="font-semibold text-slate-600">{item.label}</span>
                  <select
                    className="min-w-0 rounded border border-slate-300 bg-white px-2 py-1"
                    value={analysis.selection[item.slot] ?? ""}
                    onChange={(event) => assignDataset(item.slot, event.currentTarget.value)}
                  >
                    <option value="">-</option>
                    {project.datasets.filter(item.filter).map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Panel>
        ) : null}

        {tab === "ups" ? (
          <Panel title="UPS spectra analysis">
            <h3 className="mb-1 font-bold text-slate-700">VB set</h3>
            <ResultGrid
              rows={[
                ["EVBM", formatNumber(analysis.ups?.vbEvbm), "eV"],
                ["EF-EVBM", formatNumber(analysis.ups?.efMinusEvbm), "eV"],
              ]}
            />
            <h3 className="mb-1 mt-3 font-bold text-slate-700">IP set</h3>
            <ResultGrid
              rows={[
                ["EVBM", formatNumber(analysis.ups?.ipEvbm), "eV"],
                ["Ecut-off", formatNumber(analysis.ups?.ecutoff), "eV"],
                ["IP", formatNumber(analysis.ups?.ip), "eV"],
              ]}
            />
          </Panel>
        ) : null}

        {tab === "leips" ? (
          <Panel title="LEIPS spectra analysis">
            <label className="mb-2 grid grid-cols-[110px_1fr] items-center gap-2">
              <span className="font-semibold text-slate-600">Bandpass</span>
              <select
                className="rounded border border-slate-300 bg-white px-2 py-1"
                value={analysis.bandpassType}
                onChange={(event) => setBandpassType(Number(event.currentTarget.value))}
              >
                {BANDPASS_OPTIONS.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.label}
                  </option>
                ))}
                <option value={CUSTOM_BANDPASS_TYPE}>Custom</option>
              </select>
            </label>
            {analysis.bandpassType === CUSTOM_BANDPASS_TYPE ? (
              <label className="mb-2 grid grid-cols-[110px_1fr_34px] items-center gap-2">
                <span className="font-semibold text-slate-600">Custom</span>
                <input
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  inputMode="decimal"
                  value={analysis.customBandpassEnergy ?? ""}
                  onChange={(event) => setCustomBandpassEnergy(Number(event.currentTarget.value))}
                />
                <span className="text-slate-500">eV</span>
              </label>
            ) : null}
            <ResultGrid
              rows={[
                ["Epeak", formatNumber(analysis.leips?.ePeak), "V"],
                ["Evac", formatNumber(analysis.leips?.vacuumLevel), "eV"],
                ["EA", formatNumber(analysis.leips?.ea), "eV"],
              ]}
            />
          </Panel>
        ) : null}

        {tab === "reels" ? (
          <Panel title="REELS analysis">
            <label className="mb-2 grid grid-cols-[118px_1fr_34px] items-center gap-2">
              <span className="font-semibold text-slate-600">Incident E</span>
              <input
                className="rounded border border-slate-300 bg-white px-2 py-1"
                inputMode="decimal"
                value={analysis.reelsIncidentEnergy}
                onChange={(event) => setReelsIncidentEnergy(Number(event.currentTarget.value))}
              />
              <span className="text-slate-500">eV</span>
            </label>
            <ResultGrid rows={[["Eg", formatNumber(analysis.reels?.bandGap), "eV"]]} />
          </Panel>
        ) : null}

        {tab === "band" ? (
          <Panel title="UPS-LEIPS graph">
            <label className="mb-2 grid grid-cols-[110px_1fr] items-center gap-2">
              <span className="font-semibold text-slate-600">EF-EVBM</span>
              <input
                className="rounded border border-slate-300 bg-white px-2 py-1"
                inputMode="decimal"
                value={analysis.efMinusEvbm}
                onChange={(event) => setEfMinusEvbm(Number(event.currentTarget.value))}
              />
            </label>
            <ResultGrid
              rows={[
                ["IP", formatNumber(analysis.band?.ip), "eV"],
                ["EA", formatNumber(analysis.band?.ea), "eV"],
                ["Eg", formatNumber(analysis.band?.eg), "eV"],
              ]}
            />
          </Panel>
        ) : null}

        {tab === "fit" ? (
          <Panel title="Cursor / fitting ranges">
            <div className="grid gap-1">
              {FIT_TARGETS.map((item) => (
                <RangeEditor
                  key={item.target}
                  label={item.label}
                  range={analysis.fitRanges[fitRangeKey(item.target)]}
                  selected={item.target === activeFitTarget}
                  onChange={(range) => setFitRange(item.target, range)}
                  onFocus={() => setActiveFitTarget(item.target)}
                />
              ))}
            </div>
          </Panel>
        ) : null}
      </div>

      <div className="sticky bottom-0 border-t border-slate-300 bg-slate-100 p-2">
        <button
          className="w-full rounded bg-slate-950 px-3 py-2 font-semibold text-white hover:bg-slate-800"
          type="button"
          onClick={recalculate}
        >
          Calculate
        </button>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-300 p-2">
      <h2 className="mb-2 text-sm font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function ResultGrid({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <div className="grid gap-1">
      {rows.map(([label, value, unit]) => (
        <div key={label} className="grid grid-cols-[84px_1fr_34px] items-center gap-2">
          <span className="font-semibold text-slate-600">{label}</span>
          <span className="rounded border border-slate-300 bg-white px-2 py-1 font-mono">
            {value}
          </span>
          <span className="text-slate-500">{unit}</span>
        </div>
      ))}
    </div>
  );
}

function RangeEditor({
  label,
  selected,
  range,
  onChange,
  onFocus,
}: {
  label: string;
  selected: boolean;
  range: FitRange;
  onChange: (range: FitRange) => void;
  onFocus: () => void;
}) {
  return (
    <label
      className={
        selected
          ? "grid grid-cols-[98px_1fr] items-center gap-2 rounded border border-slate-500 bg-slate-200 px-1 py-0.5 shadow-sm"
          : "grid grid-cols-[98px_1fr] items-center gap-2 rounded border border-transparent px-1 py-0.5"
      }
      onFocus={onFocus}
      onPointerDown={onFocus}
    >
      <span
        className={selected ? "truncate font-semibold text-slate-800" : "truncate text-slate-600"}
        title={`${label}: ${formatRange(range.min, range.max)}`}
      >
        {label}
      </span>
      <span className="grid grid-cols-2 gap-1">
        <RangeNumberInput
          value={range.min}
          onChange={(value) => onChange({ ...range, min: value })}
        />
        <RangeNumberInput
          value={range.max}
          onChange={(value) => onChange({ ...range, max: value })}
        />
      </span>
    </label>
  );
}

function RangeNumberInput({
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
